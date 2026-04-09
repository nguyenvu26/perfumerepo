import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/brands')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminBrandsController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  list() {
    return this.catalogService.listBrands();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.catalogService.getBrand(Number(id));
  }

  @Post()
  create(@Body() dto: CreateBrandDto) {
    return this.catalogService.createBrand(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.catalogService.updateBrand(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.catalogService.deleteBrand(Number(id));
  }
}
