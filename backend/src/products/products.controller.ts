import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { QueryProductsDto } from './dto/query-products.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async list(@Query() query: QueryProductsDto) {
    return this.productsService.listPublic(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.productsService.getPublicById(id);
  }
}
