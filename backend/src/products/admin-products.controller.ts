import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UploadImagesDto } from './dto/upload-images.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { QueryProductsDto } from './dto/query-products.dto';

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@Query() query: QueryProductsDto) {
    return this.productsService.list(query);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.productsService.getPublicById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
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
