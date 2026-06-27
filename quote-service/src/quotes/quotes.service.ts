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
import { AiService } from '../ai/ai.service';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private readonly redisService: RedisService,
    private readonly aiService: AiService,
  ) {}

  async calculate(dto: CalculateQuoteDto) {
    const cacheKey = `quote:${dto.planCode}:${dto.sumInsured}:${dto.city}:${dto.tenure}:${JSON.stringify(dto.members)}:${JSON.stringify(dto.addonCodes)}`;

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      this.logger.log('Cache HIT — returning cached quote');
      return { ...JSON.parse(cached), cached: true };
    }

    this.logger.log('Cache MISS — calculating fresh quote');

    const planUrl = this.config.get('PLAN_SERVICE_URL');
    const planResponse = await firstValueFrom(
      this.httpService.get(`${planUrl}/plans/code/${dto.planCode}`),
    );
    const plan = planResponse.data;

    let addons: any[] = [];
    if (dto.addonCodes && dto.addonCodes.length > 0) {
      const addonsResponse = await firstValueFrom(
        this.httpService.get(`${planUrl}/plans/addons`),
      );
      addons = addonsResponse.data.filter((a: any) =>
        dto.addonCodes!.includes(a.code),
      );
    }

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

    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 24);

    const quoteEntity = this.quoteRepository.create({
      quoteId: `QT_${Date.now()}_${uuidv4().substring(0, 8).toUpperCase()}`,
      userId: dto.userId,
      planId: plan.id,
      planCode: plan.code,
      planName: plan.name,
      sumInsured: dto.sumInsured,
      tenure: dto.tenure,
      city: dto.city,
      ncbYears: dto.ncbYears || 0,
      selectedAddons: addons as Record<string, unknown>[],
      members: dto.members as unknown as Record<string, unknown>[],
      basePremium: calculation.breakdown.basePremiumPerMember,
      premiumBeforeGST: calculation.breakdown.premiumBeforeGST,
      gst: calculation.breakdown.gst,
      totalPremium: calculation.breakdown.totalPremium,
      breakdown: calculation.breakdown,
      status: QuoteStatus.ACTIVE,
      validUntil,
    });

    const saved = await this.quoteRepository.save(quoteEntity) as Quote;

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

    const ttl = this.config.get<number>('QUOTE_CACHE_TTL', 86400);
    await this.redisService.set(cacheKey, JSON.stringify(result), ttl);

    return result;
  }

  async findById(id: string): Promise<Quote> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const quote = await this.quoteRepository.findOne({
    where: isUuid ? { id } : { quoteId: id },
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
      conversionRate: total > 0 ? `${Math.round((converted / total) * 100)}%` : '0%',
    };
  }

  async explainPremium(quoteId: string) {
    const quote = await this.findById(quoteId);

    const quoteData = {
      planName: quote.planName,
      sumInsured: quote.sumInsured,
      city: quote.city,
      tenure: quote.tenure,
      members: quote.members,
      breakdown: quote.breakdown,
      addons: quote.selectedAddons,
    };

    this.logger.log(`Generating AI explanation for quote ${quoteId}`);
    const explanation = await this.aiService.explainPremium(quoteData);

    return {
      quoteId: quote.quoteId,
      totalPremium: quote.totalPremium,
      explanation,
      generatedAt: new Date().toISOString(),
    };
  }

  async suggestBetterPlan(quoteId: string) {
    const quote = await this.findById(quoteId);

    const planUrl = this.config.get('PLAN_SERVICE_URL');
    const plansResponse = await firstValueFrom(
      this.httpService.get(`${planUrl}/plans`),
    );
    const allPlans = plansResponse.data;

    const quoteData = {
      planName: quote.planName,
      city: quote.city,
      members: quote.members,
      breakdown: quote.breakdown,
    };

    this.logger.log(`Generating AI plan suggestion for quote ${quoteId}`);
    const suggestion = await this.aiService.suggestBetterPlan(quoteData, allPlans);

    return {
      quoteId: quote.quoteId,
      currentPlan: quote.planName,
      currentPremium: quote.totalPremium,
      suggestion,
      generatedAt: new Date().toISOString(),
    };
  }
}
