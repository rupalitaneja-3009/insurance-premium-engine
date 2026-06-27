import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class MemberDto {
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

  @ApiProperty({ example: 24.5, required: false })
  @IsNumber()
  @IsOptional()
  bmi?: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isSmoker?: boolean;

  @ApiProperty({ example: ['HYPERTENSION'], required: false })
  @IsArray()
  @IsOptional()
  preExistingDiseases?: string[];
}

export class CalculateQuoteDto {
  @ApiProperty({ example: 'HEALTH_PLUS' })
  @IsString()
  planCode: string;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  @Min(100000)
  sumInsured: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  @Max(3)
  tenure: number;

  @ApiProperty({ example: 'Delhi' })
  @IsString()
  city: string;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  ncbYears?: number;

  @ApiProperty({ type: [MemberDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MemberDto)
  members: MemberDto[];

  @ApiProperty({ example: ['CRITICAL_ILLNESS'], required: false })
  @IsArray()
  @IsOptional()
  addonCodes?: string[];

  @ApiProperty({ example: 'user_123', required: false })
  @IsString()
  @IsOptional()
  userId?: string;
}
