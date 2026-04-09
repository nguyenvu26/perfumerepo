import { IsOptional, IsString } from 'class-validator';

export class CreateScentFamilyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
