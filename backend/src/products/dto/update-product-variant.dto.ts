import { IsOptional, IsString } from 'class-validator';
import { CreateProductVariantDto } from './create-product-variant.dto';

export class UpdateProductVariantDto extends CreateProductVariantDto {
  @IsOptional()
  @IsString()
  id?: string;
}
