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

  @Get('scent-notes')
  listScentNotes() {
    return this.catalogService.listScentNotes();
  }
  
  @Get('categories')
  listCategories() {
    return this.catalogService.listCategories();
  }

  @Get('scent-families')
  listScentFamilies() {
    return this.catalogService.listScentFamilies();
  }
}
