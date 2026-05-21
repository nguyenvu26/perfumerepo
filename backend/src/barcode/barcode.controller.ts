import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BarcodeService } from './barcode.service';

@Controller('barcode')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STAFF', 'ADMIN')
export class BarcodeController {
  constructor(private readonly barcodeService: BarcodeService) {}

  /**
   * GET /barcode/variant/:id
   * Returns a barcode label (JSON with base64 PNG) for a single variant.
   */
  @Get('variant/:id')
  async getVariantBarcode(@Param('id') variantId: string) {
    const labels = await this.barcodeService.getLabelsForVariants([variantId]);
    return labels[0] || null;
  }

  /**
   * GET /barcode/variant/:id/image
   * Returns the raw barcode PNG image for direct display or download.
   */
  @Get('variant/:id/image')
  async getVariantBarcodeImage(
    @Param('id') variantId: string,
    @Res() res: Response,
  ) {
    const png = await this.barcodeService.generateBarcodePng(variantId);
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="barcode-${variantId}.png"`,
    });
    res.send(png);
  }

  /**
   * POST /barcode/batch
   * Body: { variantIds: string[] }
   * Returns barcode labels for multiple variants at once.
   */
  @Post('batch')
  async getBatchBarcodes(@Body() body: { variantIds: string[] }) {
    return this.barcodeService.getLabelsForVariants(body.variantIds);
  }

  /**
   * GET /barcode/product/:id
   * Returns barcode labels for all active variants of a product.
   */
  @Get('product/:id')
  async getProductBarcodes(@Param('id') productId: string) {
    return this.barcodeService.getLabelsForProduct(productId);
  }

  /**
   * GET /barcode/store/:id
   * Returns barcode labels for all variants with stock in a store.
   */
  @Get('store/:id')
  async getStoreBarcodes(@Param('id') storeId: string) {
    return this.barcodeService.getLabelsForStore(storeId);
  }
}
