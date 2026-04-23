import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async list(@Query() query: QueryProductsDto, @Req() req: any) {
    return this.productsService.listPublic(query, req.user?.userId);
  }

  @Get('top-selling')
  async getTopSelling(@Query('take') take?: string) {
    return this.productsService.getTopSelling(take ? parseInt(take, 10) : 3);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.productsService.getPublicById(id);
  }
}
