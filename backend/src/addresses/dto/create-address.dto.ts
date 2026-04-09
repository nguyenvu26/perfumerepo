import { IsString, IsInt, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsInt()
  @IsNotEmpty()
  provinceId: number;

  @IsString()
  @IsNotEmpty()
  provinceName: string;

  @IsInt()
  @IsNotEmpty()
  districtId: number;

  @IsString()
  @IsNotEmpty()
  districtName: string;

  @IsString()
  @IsNotEmpty()
  wardCode: string;

  @IsString()
  @IsNotEmpty()
  wardName: string;

  @IsString()
  @IsNotEmpty()
  detailAddress: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
