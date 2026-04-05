import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { AdminBrandsController } from './admin-brands.controller';
import { AdminCategoriesController } from './admin-categories.controller';
import { RolesGuard } from '../auth/roles.guard';
import { AdminScentFamiliesController } from './admin-scent-families.controller';
import { PublicCatalogController } from './public-catalog.controller';

@Module({
  controllers: [
    PublicCatalogController,
    AdminBrandsController,
    AdminCategoriesController,
    AdminScentFamiliesController,
  ],
  providers: [CatalogService, RolesGuard],
  exports: [CatalogService],
})
export class CatalogModule {}
