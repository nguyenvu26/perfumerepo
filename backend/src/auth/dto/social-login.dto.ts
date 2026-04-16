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

  /** Zalo phone number token (from getPhoneNumber SDK call), used to link user account by phone */
  @IsOptional()
  @IsString()
  phoneToken?: string;

  /** Resolved phone number (sent by client after calling Zalo getPhoneNumber) */
  @IsOptional()
  @IsString()
  phone?: string;
}
