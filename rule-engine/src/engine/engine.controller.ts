import { Controller, Post, Body, Get } from '@nestjs/common';
import { EngineService } from './engine.service';
import { CalculateDto } from './dto/calculate.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Rule Engine')
@Controller('engine')
export class EngineController {
  constructor(private readonly engineService: EngineService) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate premium using rule engine' })
  calculate(@Body() input: CalculateDto) {
    return this.engineService.calculate(input);
  }

  @Get('rules')
  @ApiOperation({ summary: 'Get all active rules' })
  getRules() {
    return {
      ageRules: [
        { range: '18-25', factor: '1.0x', description: 'Standard rate' },
        { range: '26-35', factor: '1.2x', description: '+20% loading' },
        { range: '36-45', factor: '1.5x', description: '+50% loading' },
        { range: '46-55', factor: '2.0x', description: '+100% loading' },
        { range: '56-65', factor: '2.8x', description: '+180% loading' },
        { range: '65+', factor: '3.5x', description: '+250% loading' },
      ],
      bmiRules: [
        { range: '<18.5', factor: '1.1x', description: 'Underweight' },
        { range: '18.5-24.9', factor: '1.0x', description: 'Normal' },
        { range: '25-29.9', factor: '1.1x', description: 'Overweight' },
        { range: '30-34.9', factor: '1.25x', description: 'Obese' },
        { range: '35+', factor: '1.5x', description: 'Severely Obese' },
      ],
      diseaseLoadings: [
        { disease: 'DIABETES', loading: '25%' },
        { disease: 'HYPERTENSION', loading: '20%' },
        { disease: 'HEART_DISEASE', loading: '40%' },
        { disease: 'CANCER', loading: '50%' },
        { disease: 'KIDNEY_DISEASE', loading: '35%' },
        { disease: 'LIVER_DISEASE', loading: '30%' },
        { disease: 'ASTHMA', loading: '15%' },
        { disease: 'THYROID', loading: '10%' },
      ],
      cityTiers: [
        {
          tier: 'METRO',
          factor: '1.2x',
          cities: 'Delhi, Mumbai, Bangalore...',
        },
        {
          tier: 'TIER_1',
          factor: '1.1x',
          cities: 'Jaipur, Lucknow, Gurugram...',
        },
        { tier: 'TIER_2', factor: '1.0x', cities: 'All other cities' },
      ],
      discounts: [
        { type: 'Family (2 members)', discount: '5%' },
        { type: 'Family (3+ members)', discount: '10%' },
        { type: 'NCB (1 year)', discount: '5%' },
        { type: 'NCB (2 years)', discount: '10%' },
        { type: 'NCB (3+ years)', discount: '15%' },
        { type: '2-year tenure', discount: '5%' },
        { type: '3-year tenure', discount: '10%' },
        { type: 'Smoker loading', loading: '15%' },
      ],
      gst: '18% on total premium',
    };
  }
}
