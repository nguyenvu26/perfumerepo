import { IsString, IsIn, IsEmail, IsOptional } from 'class-validator';

export class SocialLoginDto {
  @IsIn(['google', 'facebook'])
  provider: 'google' | 'facebook';

  @IsString()
  token: string;

  @IsEmail()
  email: string;

  @IsString()
  providerId: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
