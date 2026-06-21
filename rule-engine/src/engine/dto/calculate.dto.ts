import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class MemberInputDto {
  @ApiProperty({ example: 'SELF' })
  @IsString()
  relationship: string;

  @ApiProperty({ example: 32 })
  @IsNumber()
  @Min(1)
  @Max(99)
  age: number;

  @ApiProperty({ example: 'FEMALE' })
  @IsString()
  gender: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  bmi?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isSmoker?: boolean;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsOptional()
  preExistingDiseases?: string[];
}

export class AddonInputDto {
  @IsString()
  code: string;

  @IsNumber()
  annualPremium: number;

  @IsString()
  name: string;
}

export class CalculateDto {
  @ApiProperty({ example: 'HEALTH_PLUS' })
  @IsString()
  planCode: string;

  @ApiProperty({ example: 8000 })
  @IsNumber()
  basePremiumPer1L: number;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  sumInsured: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  tenure: number;

  @ApiProperty({ type: [MemberInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MemberInputDto)
  members: MemberInputDto[];

  @ApiProperty({ example: 'Delhi' })
  @IsString()
  city: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  ncbYears?: number;

  @ApiProperty({ required: false, type: [AddonInputDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AddonInputDto)
  addons?: AddonInputDto[];
}
