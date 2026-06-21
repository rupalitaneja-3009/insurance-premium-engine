import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Quote, QuoteStatus } from './entities/quote.entity';
import { CalculateQuoteDto } from './dto/calculate-quote.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async calculate(dto: CalculateQuoteDto) {
    const cacheKey = `quote:${dto.planCode}:${dto.sumInsured}:${dto.city}:${dto.tenure}:${JSON.stringify(dto.members)}:${JSON.stringify(dto.addonCodes)}`;

    // Check Redis cache
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      this.logger.log('Cache HIT — returning cached quote');
      return { ...JSON.parse(cached), cached: true };
    }

    this.logger.log('Cache MISS — calculating fresh quote');

    // Fetch plan from plan service
    const planUrl = this.config.get('PLAN_SERVICE_URL');
    const planResponse = await firstValueFrom(
      this.httpService.get(`${planUrl}/plans/code/${dto.planCode}`),
    );
    const plan = planResponse.data;

    // Fetch addons if any
    let addons: any[] = [];
    if (dto.addonCodes && dto.addonCodes.length > 0) {
      const addonsResponse = await firstValueFrom(
        this.httpService.get(`${planUrl}/plans/addons`),
      );
      addons = addonsResponse.data.filter((a: any) =>
        dto.addonCodes!.includes(a.code),
      );
    }

    // Call rule engine
    const ruleUrl = this.config.get('RULE_ENGINE_URL');
    const enginePayload = {
      planCode: dto.planCode,
      basePremiumPer1L: Number(plan.basePremiumPer1L),
      sumInsured: dto.sumInsured,
      tenure: dto.tenure,
      members: dto.members,
      city: dto.city,
      ncbYears: dto.ncbYears || 0,
      addons: addons.map((a) => ({
        code: a.code,
        name: a.name,
        annualPremium: Number(a.annualPremium),
      })),
    };

    const engineResponse = await firstValueFrom(
      this.httpService.post(`${ruleUrl}/engine/calculate`, enginePayload),
    );
    const calculation = engineResponse.data;

    // Save quote to DB
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 24);

    const quote = this.quoteRepository.create({
      quoteId: `QT_${Date.now()}_${uuidv4().substring(0, 8).toUpperCase()}`,
      userId: dto.userId,
      planId: plan.id,
      planCode: plan.code,
      planName: plan.name,
      sumInsured: dto.sumInsured,
      tenure: dto.tenure,
      city: dto.city,
      ncbYears: dto.ncbYears || 0,
      selectedAddons: addons,
      members: dto.members as unknown as Record<string, unknown>[],
      basePremium: calculation.breakdown.basePremiumPerMember,
      premiumBeforeGST: calculation.breakdown.premiumBeforeGST,
      gst: calculation.breakdown.gst,
      totalPremium: calculation.breakdown.totalPremium,
      breakdown: calculation.breakdown,
      status: QuoteStatus.ACTIVE,
      validUntil,
    });

    const saved = await this.quoteRepository.save(quote);

    const result = {
      quoteId: saved.quoteId,
      validUntil: saved.validUntil,
      plan: {
        code: plan.code,
        name: plan.name,
        type: plan.type,
        sumInsured: dto.sumInsured,
        tenure: dto.tenure,
        city: dto.city,
      },
      members: calculation.members,
      breakdown: calculation.breakdown,
      addons: addons.map((a) => ({
        code: a.code,
        name: a.name,
        coverageAmount: a.coverageAmount,
        annualPremium: a.annualPremium,
      })),
      cached: false,
    };

    // Cache in Redis for 24 hours
    const ttl = this.config.get<number>('QUOTE_CACHE_TTL', 86400);
    await this.redisService.set(cacheKey, JSON.stringify(result), ttl);

    return result;
  }

  async findById(id: string) {
    const quote = await this.quoteRepository.findOne({
      where: [{ id }, { quoteId: id }],
    });
    if (!quote) throw new NotFoundException(`Quote ${id} not found`);
    return quote;
  }

  async findByUserId(userId: string) {
    return this.quoteRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  async compare(dto: CalculateQuoteDto, planCodes: string[]) {
    const results = await Promise.all(
      planCodes.map((planCode) =>
        this.calculate({ ...dto, planCode }).catch((err) => ({
          planCode,
          error: err.message,
        })),
      ),
    );

    return {
      comparison: results,
      cheapest: results.reduce((min: any, curr: any) =>
        curr.breakdown?.totalPremium < (min.breakdown?.totalPremium || Infinity)
          ? curr
          : min,
      ),
    };
  }

  async getStats() {
    const [total, active, converted, expired] = await Promise.all([
      this.quoteRepository.count(),
      this.quoteRepository.count({ where: { status: QuoteStatus.ACTIVE } }),
      this.quoteRepository.count({ where: { status: QuoteStatus.CONVERTED } }),
      this.quoteRepository.count({ where: { status: QuoteStatus.EXPIRED } }),
    ]);

    return {
      total,
      byStatus: { active, converted, expired },
      conversionRate:
        total > 0 ? `${Math.round((converted / total) * 100)}%` : '0%',
    };
  }
}
