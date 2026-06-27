import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Plans')
@Controller('plans')
export class PlansController {
  constructor(
    private readonly proxyService: ProxyService,
    private readonly config: ConfigService,
  ) {}

  private get baseUrl() {
    return this.config.get('PLAN_SERVICE_URL');
  }

  @Get()
  findAll(@Query('type') type?: string) {
    const url = type
      ? `${this.baseUrl}/plans?type=${type}`
      : `${this.baseUrl}/plans`;
    return this.proxyService.forward(url, 'GET');
  }

  @Get('addons')
  findAddons(@Query('planType') planType?: string) {
    const url = planType
      ? `${this.baseUrl}/plans/addons?planType=${planType}`
      : `${this.baseUrl}/plans/addons`;
    return this.proxyService.forward(url, 'GET');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.proxyService.forward(`${this.baseUrl}/plans/${id}`, 'GET');
  }

  @Post()
  create(@Body() body: any) {
    return this.proxyService.forward(`${this.baseUrl}/plans`, 'POST', body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.proxyService.forward(
      `${this.baseUrl}/plans/${id}`,
      'PUT',
      body,
    );
  }
}
