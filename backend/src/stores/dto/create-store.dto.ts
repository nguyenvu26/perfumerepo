import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
