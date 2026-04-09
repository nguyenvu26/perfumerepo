import { Controller, Get, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class PublicCatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('brands')
  listBrands() {
    return this.catalogService.listBrands();
  }

  @Get('brands/:id')
  getBrand(@Param('id') id: string) {
    return this.catalogService.getBrand(Number(id));
  }
}
