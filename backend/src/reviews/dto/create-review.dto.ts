import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  productId: string;

  @IsInt()
  orderItemId: number;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString({ each: true })
  @IsOptional()
  images?: string[]; // URLs of uploaded images
}
