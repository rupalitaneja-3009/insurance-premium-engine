import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Quotes')
@Controller('quotes')
export class QuotesController {
  constructor(
    private readonly proxyService: ProxyService,
    private readonly config: ConfigService,
  ) {}

  private get baseUrl() {
    return this.config.get('QUOTE_SERVICE_URL');
  }

  @Post('calculate')
  calculate(@Body() body: any, @Headers() headers: any) {
    return this.proxyService.forward(
      `${this.baseUrl}/quotes/calculate`,
      'POST',
      body,
      headers,
    );
  }

  @Post('compare')
  compare(@Body() body: any, @Headers() headers: any) {
    return this.proxyService.forward(
      `${this.baseUrl}/quotes/compare`,
      'POST',
      body,
      headers,
    );
  }

  @Get('stats')
  getStats() {
    return this.proxyService.forward(`${this.baseUrl}/quotes/stats`, 'GET');
  }

  @Get('history')
  getHistory(@Query('userId') userId: string) {
    return this.proxyService.forward(
      `${this.baseUrl}/quotes/history?userId=${userId}`,
      'GET',
    );
  }

  @Get(':id/explain')
  explainPremium(@Param('id') id: string) {
    return this.proxyService.forward(
      `${this.baseUrl}/quotes/${id}/explain`,
      'GET',
    );
  }

  @Get(':id/suggest')
  suggestPlan(@Param('id') id: string) {
    return this.proxyService.forward(
      `${this.baseUrl}/quotes/${id}/suggest`,
      'GET',
    );
  }

  @Get(':id/underwriting-review')
  underwritingReview(@Param('id') id: string) {
    return this.proxyService.forward(
      `${this.baseUrl}/quotes/${id}/underwriting-review`,
      'GET',
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.proxyService.forward(`${this.baseUrl}/quotes/${id}`, 'GET');
  }
}
