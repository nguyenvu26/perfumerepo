import { IsString, IsIn, IsEmail, IsOptional } from 'class-validator';

export class SocialLoginDto {
  @IsIn(['google', 'facebook', 'zalo'])
  provider: 'google' | 'facebook' | 'zalo';

  @IsString()
  token: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  providerId: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
