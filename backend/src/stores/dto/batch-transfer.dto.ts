import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class BatchTransferItemDto {
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

export class BatchTransferDto {
  @IsString()
  fromStoreId: string;

  @IsString()
  toStoreId: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BatchTransferItemDto)
  items: BatchTransferItemDto[];
}

