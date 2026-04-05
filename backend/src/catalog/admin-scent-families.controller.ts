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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateScentFamilyDto } from './dto/create-scent-family.dto';
import { UpdateScentFamilyDto } from './dto/update-scent-family.dto';

@Controller('admin/scent-families')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminScentFamiliesController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  list() {
    return this.catalogService.listScentFamilies();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.catalogService.getScentFamily(Number(id));
  }

  @Post()
  create(@Body() dto: CreateScentFamilyDto) {
    return this.catalogService.createScentFamily(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateScentFamilyDto) {
    return this.catalogService.updateScentFamily(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.catalogService.deleteScentFamily(Number(id));
  }
}
