import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client: OpenAI;

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });
  }

  private async askOpenAi(prompt: string, maxTokens = 1024): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.get<string>('AI_MODEL', 'gpt-4o-mini'),
        temperature: 0.2,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      });

      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      this.logger.error(`OpenAI API failed: ${error?.message}`);
      throw error;
    }
  }

  private generateFallbackUnderwritingReview(quoteData: any) {
    const members = quoteData.members || [];

    const hasDisease = members.some(
      (m: any) => m.preExistingDiseases?.length > 0,
    );

    const hasHighBmi = members.some((m: any) => Number(m.bmi) >= 30);
    const hasSmoker = members.some((m: any) => m.isSmoker);
    const hasSeniorAge = members.some((m: any) => Number(m.age) >= 55);

    const score =
      25 +
      (hasDisease ? 25 : 0) +
      (hasHighBmi ? 20 : 0) +
      (hasSmoker ? 20 : 0) +
      (hasSeniorAge ? 10 : 0);

    return {
      riskScore: Math.min(score, 100),
      riskBand: score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW',
      underwritingDecision:
        score >= 70
          ? 'MANUAL_REVIEW'
          : score >= 40
            ? 'APPROVE_WITH_ADDITIONAL_CHECKS'
            : 'AUTO_APPROVE',
      reasons: [
        ...(hasDisease ? ['Pre-existing medical condition declared'] : []),
        ...(hasHighBmi ? ['BMI is in high-risk range'] : []),
        ...(hasSmoker ? ['Smoker profile increases health risk'] : []),
        ...(hasSeniorAge
          ? ['Senior age profile requires additional review']
          : []),
      ],
      missingQuestions: [
        ...(hasDisease
          ? [
              'How long has the customer had the declared condition?',
              'Is the condition controlled with medication?',
            ]
          : []),
        ...(hasHighBmi
          ? ['Has there been any recent weight-related diagnosis?']
          : []),
        ...(hasSmoker
          ? ['How many cigarettes does the customer smoke per day?']
          : []),
      ],
      recommendedDocuments: [
        ...(hasDisease
          ? ['Recent medical reports', 'Doctor consultation summary']
          : []),
        ...(hasHighBmi ? ['Basic health checkup report'] : []),
        ...(hasSeniorAge ? ['Latest full body checkup report'] : []),
      ],
      recommendedAction:
        score >= 70
          ? 'Send this case for manual underwriting review before policy issuance.'
          : score >= 40
            ? 'Approve only after collecting additional health information.'
            : 'Customer profile looks suitable for auto approval.',
      source: 'FALLBACK_RULE_ENGINE',
    };
  }

  async explainPremium(quoteData: any): Promise<string> {
    const devMode = this.config.get('AI_DEV_MODE') === 'true';

    if (devMode) {
      this.logger.log('[AI DEV MODE] Returning mock premium explanation');
      return `Premium Analysis for ${quoteData.planName}: Your total premium is calculated based on age factor, city factor, disease loading, and selected add-ons. Tips: opt for 2-year policy for 5% discount, maintain healthy BMI, and build NCB for future discounts.`;
    }

    const prompt = `
Explain this health insurance premium in simple customer-friendly language.

Focus on:
- Why the premium is this amount
- Key loading factors
- Discounts applied
- Practical tips to reduce future premium

Quote data:
${JSON.stringify(quoteData)}
`;

    try {
      const text = await this.askOpenAi(prompt, 1024);
      return text || 'Unable to generate explanation.';
    } catch (error: any) {
      if (error?.status === 429 || error?.code === 'insufficient_quota') {
        return `AI quota is currently unavailable. Fallback explanation: The premium is calculated using the selected plan, member age, BMI, city tier, smoking status, pre-existing diseases, selected add-ons, discounts, and GST.`;
      }

      throw error;
    }
  }

  async suggestBetterPlan(quoteData: any, allPlans: any[]): Promise<string> {
    const devMode = this.config.get('AI_DEV_MODE') === 'true';

    if (devMode) {
      this.logger.log('[AI DEV MODE] Returning mock plan suggestion');
      return `Based on your profile, HealthShield Premium offers better coverage with shorter waiting periods and includes annual health checkup. Consider upgrading for comprehensive coverage.`;
    }

    const prompt = `
You are an insurance plan recommendation assistant.

Suggest the most suitable plan from the available plans for this customer.
Keep the answer short, practical, and customer-friendly.

Available plans:
${JSON.stringify(
  allPlans.map((p: any) => ({
    code: p.code,
    name: p.name,
    type: p.type,
    minSumInsured: p.minSumInsured,
    maxSumInsured: p.maxSumInsured,
    minAge: p.minAge,
    maxAge: p.maxAge,
    maxMembers: p.maxMembers,
    coverageDetails: p.coverageDetails,
    waitingPeriods: p.waitingPeriods,
  })),
)}

Customer quote:
${JSON.stringify(quoteData)}
`;

    try {
      const text = await this.askOpenAi(prompt, 700);
      return text || 'Unable to generate suggestion.';
    } catch (error: any) {
      if (error?.status === 429 || error?.code === 'insufficient_quota') {
        return `AI quota is currently unavailable. Fallback suggestion: Compare plans based on sum insured, member count, waiting periods, add-on compatibility, and total premium.`;
      }

      throw error;
    }
  }

  async underwritingReview(quoteData: any): Promise<any> {
    const devMode = this.config.get('AI_DEV_MODE') === 'true';

    if (devMode) {
      this.logger.log('[AI DEV MODE] Returning fallback underwriting review');
      return this.generateFallbackUnderwritingReview(quoteData);
    }

    const prompt = `
You are an insurance underwriting assistant.

Analyze the given health insurance quote profile and return ONLY valid JSON.
Do not include markdown, explanation, or extra text.

Return this exact JSON structure:
{
  "riskScore": number,
  "riskBand": "LOW" | "MEDIUM" | "HIGH",
  "underwritingDecision": "AUTO_APPROVE" | "APPROVE_WITH_ADDITIONAL_CHECKS" | "MANUAL_REVIEW" | "DECLINE",
  "reasons": string[],
  "missingQuestions": string[],
  "recommendedDocuments": string[],
  "recommendedAction": string,
  "source": "OPENAI"
}

Rules:
- riskScore must be between 0 and 100.
- Use LOW for 0-39, MEDIUM for 40-69, HIGH for 70-100.
- Use AUTO_APPROVE only for low-risk profiles.
- Use MANUAL_REVIEW for high BMI, smoking, multiple diseases, senior age, or unclear medical history.
- Recommend documents only when needed.

Quote profile:
${JSON.stringify(quoteData)}
`;

    let text = '';

    try {
      text = await this.askOpenAi(prompt, 1024);
    } catch (error: any) {
      if (error?.status === 429 || error?.code === 'insufficient_quota') {
        this.logger.warn(
          'OpenAI quota exhausted. Falling back to deterministic underwriting review.',
        );
        return this.generateFallbackUnderwritingReview(quoteData);
      }

      throw error;
    }

    try {
      const parsed = JSON.parse(text);

      return {
        ...parsed,
        source: parsed.source || 'OPENAI',
      };
    } catch {
      return {
        riskScore: 50,
        riskBand: 'MEDIUM',
        underwritingDecision: 'APPROVE_WITH_ADDITIONAL_CHECKS',
        reasons: ['AI response could not be parsed as JSON'],
        missingQuestions: ['Please verify customer medical details manually'],
        recommendedDocuments: ['Basic health declaration form'],
        recommendedAction: text || 'Manual underwriting review recommended.',
        source: 'OPENAI_PARSE_FALLBACK',
      };
    }
  }
}
