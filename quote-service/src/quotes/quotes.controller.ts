import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CalculateQuoteDto } from './dto/calculate-quote.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Quotes')
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate insurance premium quote' })
  calculate(
    @Body() dto: CalculateQuoteDto,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    return this.quotesService.calculate(dto, idempotencyKey, correlationId);
  }
  @Post('compare')
  @ApiOperation({ summary: 'Compare premium across multiple plans' })
  compare(
    @Body('quoteDetails') dto: CalculateQuoteDto,
    @Body('planCodes') planCodes: string[],
  ) {
    return this.quotesService.compare(dto, planCodes);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get quote statistics' })
  getStats() {
    return this.quotesService.getStats();
  }

  @Get('history')
  @ApiOperation({ summary: 'Get quote history for user' })
  getHistory(@Query('userId') userId: string) {
    return this.quotesService.findByUserId(userId);
  }

  @Get(':id/explain')
  @ApiOperation({ summary: 'AI explanation of why premium is this amount' })
  explainPremium(@Param('id') id: string) {
    return this.quotesService.explainPremium(id);
  }

  @Get(':id/suggest')
  @ApiOperation({ summary: 'AI suggestion for better plan' })
  suggestPlan(@Param('id') id: string) {
    return this.quotesService.suggestBetterPlan(id);
  }

  @Get(':id/underwriting-review')
  @ApiOperation({ summary: 'AI underwriting risk review for quote' })
  underwritingReview(@Param('id') id: string) {
    return this.quotesService.underwritingReview(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quote by ID' })
  findOne(@Param('id') id: string) {
    return this.quotesService.findById(id);
  }
}
