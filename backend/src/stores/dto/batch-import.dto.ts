import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class BatchImportItemDto {
  @IsString()
  variantId: string;

  /**
   * Frontend input UX allows temporarily empty strings while typing.
   * We accept number|string here and normalize in service to avoid 400s.
   */
  @IsOptional()
  @Type(() => Number)
  quantity?: number;
}

export class BatchImportDto {
  @IsString()
  storeId: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BatchImportItemDto)
  items: BatchImportItemDto[];
}

