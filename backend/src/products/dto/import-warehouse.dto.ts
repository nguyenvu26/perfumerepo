import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class ImportWarehouseDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
