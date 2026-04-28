import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UploadImagesDto } from './dto/upload-images.dto';
import { ImportWarehouseDto } from './dto/import-warehouse.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { QueryProductsDto } from './dto/query-products.dto';

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get('stats')
  stats() {
    return this.productsService.adminStats();
  }

  @Get()
  list(@Query() query: QueryProductsDto) {
    return this.productsService.list(query);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateProductDto) {
    const userId = req.user.userId;
    return this.productsService.create(dto, userId);
  }

  @Post('import')
  async importToWarehouse(@Req() req: any, @Body() dto: ImportWarehouseDto) {
    const userId = req.user.userId;
    return this.productsService.importToWarehouse(dto.variantId, dto.quantity, userId, dto.reason);
  }

  @Get('inventory-logs')
  async getInventoryLogs(
    @Query('variantId') variantId?: string,
    @Query('type') type?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.productsService.getInventoryLogs({
      variantId,
      type,
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 20,
    });
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.productsService.getPublicById(id);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    const userId = req.user.userId;
    return this.productsService.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('images', 10)) // Max 10 images
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadImagesDto,
  ) {
    return this.productsService.uploadImages(id, files, dto.orders);
  }

  @Delete(':id/images/:imageId')
  async deleteImage(
    @Param('id') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productsService.deleteImage(productId, imageId);
  }
}
