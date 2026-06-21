import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { PlanType } from '../entities/plan.entity';

export class CreatePlanDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsEnum(PlanType)
  type: PlanType;

  @IsNumber()
  @Min(1000)
  basePremiumPer1L: number;

  @IsNumber()
  minSumInsured: number;

  @IsNumber()
  maxSumInsured: number;

  @IsNumber()
  @Min(18)
  @Max(99)
  minAge: number;

  @IsNumber()
  @Max(99)
  maxAge: number;

  @IsNumber()
  @Min(1)
  maxMembers: number;

  @IsOptional()
  coverageDetails?: Record<string, unknown>;

  @IsOptional()
  waitingPeriods?: Record<string, unknown>[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
