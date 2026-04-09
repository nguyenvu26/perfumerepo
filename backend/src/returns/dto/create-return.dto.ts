import {
  IsString,
  IsArray,
  IsOptional,
  IsInt,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReturnItemDto {
  @IsString()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class CreateReturnDto {
  @IsString()
  orderId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];

  @IsOptional()
  @IsString()
  reason?: string;

  // POS fields (staff only)
  @IsOptional()
  @IsString()
  origin?: 'ONLINE' | 'POS';
}
