import {
  IsString,
  IsArray,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  ValidateNested,
  ArrayMinSize,
  IsIn,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReceiveItemDto {
  @IsString()
  variantId: string;

  @IsInt()
  @Min(0)
  qtyReceived: number;

  @IsOptional()
  @IsString()
  @IsIn(['NEW_SEALED', 'OPENED', 'DAMAGED', 'LEAKED', 'OTHER'])
  condition?: string;

  @IsOptional()
  @IsBoolean()
  sealIntact?: boolean;
}

export class ReceiveReturnDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items: ReceiveItemDto[];

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  @IsIn(['WAREHOUSE', 'POS'])
  receivedLocation?: string;

  /** Admin unboxing evidence photos (required when marking items as damaged) */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceImages?: string[];
}
