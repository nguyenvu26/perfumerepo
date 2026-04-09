import { IsString, IsOptional } from 'class-validator';

export class CreateReturnShipmentDto {
  @IsOptional()
  @IsString()
  courier?: string;

  @IsString()
  trackingNumber: string;
}
