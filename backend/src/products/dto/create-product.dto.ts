import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductVariantDto } from './create-product-variant.dto';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsInt()
  brandId: number;

  @IsOptional()
  @IsInt()
  categoryId?: number | null;

  @IsOptional()
  @IsInt()
  scentFamilyId?: number | null;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  longevity?: string;

  @IsOptional()
  @IsString()
  concentration?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  sillage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seasons?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  timeOfDay?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  occasions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  styles?: string[];

  @IsOptional()
  @IsString()
  targetAge?: string;

  @IsOptional()
  @IsString()
  ingredients?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants: CreateProductVariantDto[];

  @IsOptional()
  @IsArray()
  scentNotes?: { name: string; type: 'TOP' | 'MIDDLE' | 'BASE' }[];
}
