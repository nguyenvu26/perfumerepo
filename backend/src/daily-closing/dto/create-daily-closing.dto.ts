import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDailyClosingDto {
  @IsNotEmpty()
  @IsString()
  storeId: string;

  @IsNotEmpty()
  @IsNumber()
  systemTotal: number;

  @IsNotEmpty()
  @IsNumber()
  systemCash: number;

  @IsNotEmpty()
  @IsNumber()
  systemTransfer: number;

  @IsNotEmpty()
  @IsNumber()
  actualCash: number;

  @IsOptional()
  @IsNumber()
  actualTransfer?: number;

  @IsNotEmpty()
  @IsNumber()
  difference: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsNotEmpty()
  @IsNumber()
  orderCount: number;
}
