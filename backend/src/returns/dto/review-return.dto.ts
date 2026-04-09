import { IsString, IsOptional, IsIn } from 'class-validator';

export class ReviewReturnDto {
  @IsString()
  @IsIn(['approve', 'reject'])
  action: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  note?: string;
}

export class RequestMoreInfoDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  deadline?: string; // ISO date string
}
