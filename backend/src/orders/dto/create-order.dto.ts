import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsInt()
  shippingProvinceId?: number;

  @IsOptional()
  @IsInt()
  shippingDistrictId?: number;

  @IsOptional()
  @IsString()
  shippingWardCode?: string;

  @IsOptional()
  @IsNumber()
  shippingFee?: number;

  @IsOptional()
  @IsInt()
  shippingServiceId?: number;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  promotionCode?: string;

  @IsOptional()
  redeemPoints?: number;

  @IsOptional()
  @IsString()
  paymentMethod?: 'COD' | 'ONLINE';
}
