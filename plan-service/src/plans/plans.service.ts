import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan, PlanType } from './entities/plan.entity';
import { Addon } from './entities/addon.entity';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class PlansService implements OnModuleInit {
  constructor(
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(Addon)
    private addonRepository: Repository<Addon>,
  ) {}

  async onModuleInit() {
    await this.seedData();
  }

  async seedData() {
    const count = await this.planRepository.count();
    if (count > 0) return;

    const plans = [
      {
        code: 'HEALTH_BASIC',
        name: 'HealthShield Basic',
        type: PlanType.INDIVIDUAL,
        basePremiumPer1L: 5000,
        minSumInsured: 100000,
        maxSumInsured: 500000,
        minAge: 18,
        maxAge: 65,
        maxMembers: 1,
        coverageDetails: {
          hospitalization: true,
          daycare: true,
          ambulance: true,
          preExisting: false,
          maternity: false,
          dental: false,
          vision: false,
          mentalHealth: false,
        },
        waitingPeriods: [
          { condition: 'preExisting', days: 0, note: 'Not covered' },
          { condition: 'maternity', days: 0, note: 'Not covered' },
        ],
      },
      {
        code: 'HEALTH_PLUS',
        name: 'HealthShield Plus',
        type: PlanType.INDIVIDUAL,
        basePremiumPer1L: 8000,
        minSumInsured: 300000,
        maxSumInsured: 2000000,
        minAge: 18,
        maxAge: 65,
        maxMembers: 1,
        coverageDetails: {
          hospitalization: true,
          daycare: true,
          ambulance: true,
          preExisting: true,
          maternity: true,
          dental: false,
          vision: true,
          mentalHealth: true,
          domiciliary: true,
          ayush: true,
        },
        waitingPeriods: [
          { condition: 'preExisting', days: 730, note: '2 year waiting' },
          { condition: 'maternity', days: 270, note: '9 month waiting' },
        ],
      },
      {
        code: 'HEALTH_FAMILY',
        name: 'HealthShield Family Floater',
        type: PlanType.FAMILY_FLOATER,
        basePremiumPer1L: 7000,
        minSumInsured: 300000,
        maxSumInsured: 5000000,
        minAge: 18,
        maxAge: 65,
        maxMembers: 6,
        coverageDetails: {
          hospitalization: true,
          daycare: true,
          ambulance: true,
          preExisting: true,
          maternity: true,
          newborn: true,
          vaccination: true,
          dental: false,
          vision: true,
        },
        waitingPeriods: [
          { condition: 'preExisting', days: 730, note: '2 year waiting' },
          { condition: 'maternity', days: 270, note: '9 month waiting' },
        ],
      },
      {
        code: 'HEALTH_PREMIUM',
        name: 'HealthShield Premium',
        type: PlanType.INDIVIDUAL,
        basePremiumPer1L: 12000,
        minSumInsured: 500000,
        maxSumInsured: 10000000,
        minAge: 18,
        maxAge: 65,
        maxMembers: 1,
        coverageDetails: {
          hospitalization: true,
          daycare: true,
          ambulance: true,
          preExisting: true,
          maternity: true,
          dental: true,
          vision: true,
          mentalHealth: true,
          domiciliary: true,
          ayush: true,
          internationalCover: true,
          annualHealthCheckup: true,
          personalAccident: true,
        },
        waitingPeriods: [
          { condition: 'preExisting', days: 365, note: '1 year waiting' },
          { condition: 'maternity', days: 180, note: '6 month waiting' },
        ],
      },
      {
        code: 'HEALTH_SENIOR',
        name: 'HealthShield Senior',
        type: PlanType.SENIOR_CITIZEN,
        basePremiumPer1L: 15000,
        minSumInsured: 200000,
        maxSumInsured: 1000000,
        minAge: 60,
        maxAge: 80,
        maxMembers: 2,
        coverageDetails: {
          hospitalization: true,
          daycare: true,
          ambulance: true,
          preExisting: true,
          domiciliary: true,
          ayush: true,
          annualHealthCheckup: true,
          teleconsultation: true,
          homeHealthcare: true,
        },
        waitingPeriods: [
          { condition: 'preExisting', days: 365, note: '1 year waiting' },
        ],
      },
    ];

    for (const plan of plans) {
      await this.planRepository.save(this.planRepository.create(plan));
    }

    const addons = [
      {
        code: 'CRITICAL_ILLNESS',
        name: 'Critical Illness Cover',
        description: 'Lump sum payout on diagnosis of 32 critical illnesses',
        annualPremium: 3500,
        coverageAmount: 1000000,
        compatiblePlanTypes: ['INDIVIDUAL', 'FAMILY_FLOATER'],
      },
      {
        code: 'OPD_COVER',
        name: 'OPD Cover',
        description: 'Covers outpatient consultations and medicines',
        annualPremium: 2000,
        coverageAmount: 25000,
        compatiblePlanTypes: ['INDIVIDUAL', 'FAMILY_FLOATER', 'SENIOR_CITIZEN'],
      },
      {
        code: 'PERSONAL_ACCIDENT',
        name: 'Personal Accident Cover',
        description: 'Covers accidental death and disability',
        annualPremium: 1500,
        coverageAmount: 2000000,
        compatiblePlanTypes: ['INDIVIDUAL', 'FAMILY_FLOATER'],
      },
      {
        code: 'MATERNITY_PLUS',
        name: 'Maternity Plus',
        description: 'Enhanced maternity coverage with newborn cover',
        annualPremium: 4000,
        coverageAmount: 100000,
        compatiblePlanTypes: ['INDIVIDUAL', 'FAMILY_FLOATER'],
      },
      {
        code: 'DENTAL_VISION',
        name: 'Dental & Vision Care',
        description: 'Covers dental treatments and vision correction',
        annualPremium: 2500,
        coverageAmount: 30000,
        compatiblePlanTypes: ['INDIVIDUAL', 'FAMILY_FLOATER'],
      },
      {
        code: 'INTERNATIONAL_COVER',
        name: 'International Travel Cover',
        description: 'Emergency medical coverage while traveling abroad',
        annualPremium: 5000,
        coverageAmount: 5000000,
        compatiblePlanTypes: ['INDIVIDUAL'],
      },
      {
        code: 'HOME_HEALTHCARE',
        name: 'Home Healthcare',
        description: 'Medical treatment in the comfort of your home',
        annualPremium: 1800,
        coverageAmount: 50000,
        compatiblePlanTypes: ['INDIVIDUAL', 'FAMILY_FLOATER', 'SENIOR_CITIZEN'],
      },
      {
        code: 'MENTAL_WELLNESS',
        name: 'Mental Wellness Cover',
        description: 'Covers psychiatric consultations and therapy',
        annualPremium: 1200,
        coverageAmount: 20000,
        compatiblePlanTypes: ['INDIVIDUAL', 'FAMILY_FLOATER'],
      },
    ];

    for (const addon of addons) {
      await this.addonRepository.save(this.addonRepository.create(addon));
    }

    console.log('✅ Seed data loaded: 5 plans + 8 addons');
  }

  async findAllPlans(type?: string) {
    const where: any = { isActive: true };
    if (type) where.type = type;
    return this.planRepository.find({ where });
  }

  async findPlanById(id: string) {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan ${id} not found`);
    return plan;
  }

  async findPlanByCode(code: string) {
    const plan = await this.planRepository.findOne({ where: { code } });
    if (!plan) throw new NotFoundException(`Plan ${code} not found`);
    return plan;
  }

  async findAllAddons(planType?: string) {
    const addons = await this.addonRepository.find({
      where: { isActive: true },
    });
    if (planType) {
      return addons.filter((a) => a.compatiblePlanTypes.includes(planType));
    }
    return addons;
  }

  async findAddonByCode(code: string) {
    const addon = await this.addonRepository.findOne({ where: { code } });
    if (!addon) throw new NotFoundException(`Addon ${code} not found`);
    return addon;
  }

  async createPlan(dto: CreatePlanDto) {
    const plan = this.planRepository.create(dto);
    return this.planRepository.save(plan);
  }

  async updatePlan(id: string, dto: Partial<CreatePlanDto>) {
    const plan = await this.findPlanById(id);
    Object.assign(plan, dto);
    return this.planRepository.save(plan);
  }
}
