import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active plans' })
  findAll(@Query('type') type?: string) {
    return this.plansService.findAllPlans(type);
  }

  @Get('addons')
  @ApiOperation({ summary: 'Get all available addons' })
  findAddons(@Query('planType') planType?: string) {
    return this.plansService.findAllAddons(planType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan by ID' })
  findOne(@Param('id') id: string) {
    return this.plansService.findPlanById(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get plan by code' })
  findByCode(@Param('code') code: string) {
    return this.plansService.findPlanByCode(code);
  }

  @Post()
  @ApiOperation({ summary: 'Create new plan (Admin)' })
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.createPlan(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update plan (Admin)' })
  update(@Param('id') id: string, @Body() dto: Partial<CreatePlanDto>) {
    return this.plansService.updatePlan(id, dto);
  }
}
