import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { UserRoleEnum } from '@prisma/client';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsEnum(UserRoleEnum)
  role?: UserRoleEnum;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
