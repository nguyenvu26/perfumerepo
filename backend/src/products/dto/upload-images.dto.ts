import { IsArray, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UploadImagesDto {
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(9, { each: true })
  @IsOptional()
  orders?: number[]; // Display order for each image (0-9)
}
