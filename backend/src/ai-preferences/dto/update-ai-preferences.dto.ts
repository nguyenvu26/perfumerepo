import { IsArray, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateAiPreferencesDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  riskLevel?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredNotes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  avoidedNotes?: string[];
}
