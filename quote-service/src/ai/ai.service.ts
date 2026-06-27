import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client: Anthropic;

  constructor(private readonly config: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async explainPremium(quoteData: any): Promise<string> {
    const devMode = this.config.get('AI_DEV_MODE') === 'true';
    if (devMode) {
      this.logger.log('[AI DEV MODE] Returning mock premium explanation');
      return `Premium Analysis for ${quoteData.planName}: Your total premium is calculated based on age factor, city factor, disease loading, and selected addons. Tips: opt for 2-year policy for 5% discount, maintain healthy BMI, build NCB for future discounts.`;
    }

    const message = await this.client.messages.create({
      model: this.config.get<string>('AI_MODEL', 'claude-sonnet-4-6'),
      max_tokens: 1024,
      messages: [{ role: 'user', content: `Explain this insurance premium in simple language: ${JSON.stringify(quoteData)}` }],
    });

    const content = message.content[0];
    if (content.type === 'text') return content.text;
    return 'Unable to generate explanation.';
  }

  async suggestBetterPlan(quoteData: any, allPlans: any[]): Promise<string> {
    const devMode = this.config.get('AI_DEV_MODE') === 'true';
    if (devMode) {
      this.logger.log('[AI DEV MODE] Returning mock plan suggestion');
      return `Based on your profile, HealthShield Premium offers better coverage with shorter waiting periods and includes annual health checkup. Consider upgrading for comprehensive coverage.`;
    }

    const message = await this.client.messages.create({
      model: this.config.get<string>('AI_MODEL', 'claude-sonnet-4-6'),
      max_tokens: 512,
      messages: [{ role: 'user', content: `Suggest best plan from ${allPlans.map((p: any) => p.name).join(', ')} for: ${JSON.stringify(quoteData)}` }],
    });

    const content = message.content[0];
    if (content.type === 'text') return content.text;
    return 'Unable to generate suggestion.';
  }
}
