import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { PromotionDiscountType } from '@prisma/client';

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PromotionDiscountType)
  discountType: PromotionDiscountType;

  @IsInt()
  @Min(0)
  discountValue: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  usageLimit?: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  pointsCost?: number;
}

export class ValidatePromotionDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsInt()
  @Min(0)
  amount: number;
}
