import { Injectable, Logger } from '@nestjs/common';
import { applyAgeRule } from './rules/age.rule';
import { applyBmiRule } from './rules/bmi.rule';
import { applyDiseaseRule } from './rules/disease.rule';
import { applyCityRule } from './rules/city.rule';
import { calculateAddonsPremium } from './rules/addon.rule';

export interface MemberInput {
  relationship: string;
  age: number;
  gender: string;
  bmi?: number;
  isSmoker?: boolean;
  preExistingDiseases?: string[];
}

export interface CalculateInput {
  planCode: string;
  basePremiumPer1L: number;
  sumInsured: number;
  tenure: number;
  members: MemberInput[];
  city: string;
  ncbYears?: number;
  addons?: { code: string; annualPremium: number; name: string }[];
}

@Injectable()
export class EngineService {
  private readonly logger = new Logger(EngineService.name);

  calculate(input: CalculateInput) {
    this.logger.log(`Calculating premium for plan: ${input.planCode}`);

    const sumInsuredInLakhs = input.sumInsured / 100000;
    const basePremiumForSI = input.basePremiumPer1L * sumInsuredInLakhs;

    const memberBreakdowns = input.members.map((member) => {
      return this.calculateMemberPremium(member, basePremiumForSI, input.city);
    });

    let combinedPremium = memberBreakdowns.reduce(
      (sum, m) => sum + m.finalMemberPremium,
      0,
    );

    // Family discount
    let familyDiscount = 0;
    let familyDiscountDesc = '';
    if (input.members.length === 2) {
      familyDiscount = combinedPremium * 0.05;
      familyDiscountDesc = 'Family discount (2 members): -5%';
    } else if (input.members.length >= 3) {
      familyDiscount = combinedPremium * 0.1;
      familyDiscountDesc = `Family discount (${input.members.length} members): -10%`;
    }
    combinedPremium -= familyDiscount;

    // NCB discount
    let ncbDiscount = 0;
    let ncbDiscountDesc = '';
    if (input.ncbYears && input.ncbYears > 0) {
      const ncbRate = Math.min(input.ncbYears * 0.05, 0.15);
      ncbDiscount = combinedPremium * ncbRate;
      ncbDiscountDesc = `NCB discount (${input.ncbYears} years): -${ncbRate * 100}%`;
      combinedPremium -= ncbDiscount;
    }

    // Tenure discount
    let tenureDiscount = 0;
    let tenureDiscountDesc = '';
    if (input.tenure === 2) {
      tenureDiscount = combinedPremium * 0.05;
      tenureDiscountDesc = '2-year tenure discount: -5%';
      combinedPremium -= tenureDiscount;
    } else if (input.tenure >= 3) {
      tenureDiscount = combinedPremium * 0.1;
      tenureDiscountDesc = '3-year tenure discount: -10%';
      combinedPremium -= tenureDiscount;
    }

    // Addons
    const addonResult = calculateAddonsPremium(input.addons || []);
    const premiumBeforeGST = combinedPremium + addonResult.totalAddonPremium;

    // GST 18%
    const gst = premiumBeforeGST * 0.18;
    const totalPremium = premiumBeforeGST + gst;

    return {
      planCode: input.planCode,
      sumInsured: input.sumInsured,
      tenure: input.tenure,
      members: memberBreakdowns,
      breakdown: {
        basePremiumPerMember: Math.round(basePremiumForSI),
        combinedMemberPremium: Math.round(
          memberBreakdowns.reduce((s, m) => s + m.finalMemberPremium, 0),
        ),
        discounts: {
          family:
            familyDiscount > 0
              ? {
                  amount: Math.round(familyDiscount),
                  description: familyDiscountDesc,
                }
              : null,
          ncb:
            ncbDiscount > 0
              ? {
                  amount: Math.round(ncbDiscount),
                  description: ncbDiscountDesc,
                }
              : null,
          tenure:
            tenureDiscount > 0
              ? {
                  amount: Math.round(tenureDiscount),
                  description: tenureDiscountDesc,
                }
              : null,
        },
        addons: addonResult.breakdown,
        totalAddonPremium: Math.round(addonResult.totalAddonPremium),
        premiumBeforeGST: Math.round(premiumBeforeGST),
        gst: Math.round(gst),
        totalPremium: Math.round(totalPremium),
      },
    };
  }

  private calculateMemberPremium(
    member: MemberInput,
    basePremium: number,
    city: string,
  ) {
    const ageResult = applyAgeRule(member.age);
    const bmiResult = applyBmiRule(member.bmi || 22);
    const diseaseResult = applyDiseaseRule(member.preExistingDiseases || []);
    const cityResult = applyCityRule(city);

    let premium = basePremium;
    premium *= ageResult.factor;
    premium *= bmiResult.factor;
    premium *= cityResult.factor;
    premium *= 1 + diseaseResult.loading;

    if (member.isSmoker) {
      premium *= 1.15;
    }

    return {
      relationship: member.relationship,
      age: member.age,
      basePremium: Math.round(basePremium),
      finalMemberPremium: Math.round(premium),
      loadings: {
        age: ageResult.description,
        bmi: bmiResult.description,
        disease: diseaseResult.description,
        city: cityResult.description,
        smoker: member.isSmoker
          ? 'Smoker: +15% loading'
          : 'Non-smoker: No loading',
      },
    };
  }
}
