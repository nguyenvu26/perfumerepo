import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bwipjs from 'bwip-js';

export interface BarcodeLabel {
  variantId: string;
  productName: string;
  variantName: string;
  brandName: string;
  sku: string | null;
  barcode: string;
  price: number;
  barcodeDataUrl: string; // base64 PNG
}

@Injectable()
export class BarcodeService {
  constructor(private readonly prisma: PrismaService) {}

  private async safeGenerateBuffer(
    text: string,
    options: Record<string, any>,
  ): Promise<Buffer> {
    const isEan13 = /^\d{13}$/.test(text);

    try {
      return await bwipjs.toBuffer({
        bcid: isEan13 ? 'ean13' : 'code128',
        text,
        ...options,
      });
    } catch (e) {
      if (isEan13) {
        // Fallback to code128 if EAN-13 check digit is invalid
        return await bwipjs.toBuffer({
          bcid: 'code128',
          text,
          ...options,
        });
      }
      throw e;
    }
  }

  /**
   * Generate a barcode image (base64 PNG) from a barcode string.
   * Uses EAN-13 format if the barcode is 13 digits, otherwise CODE128.
   */
  async generateBarcodeImage(barcodeText: string): Promise<string> {
    const png = await this.safeGenerateBuffer(barcodeText, {
      scale: 3,
      height: 12,
      includetext: false,
      textxalign: 'center',
      textsize: 10,
    });

    return `data:image/png;base64,${png.toString('base64')}`;
  }

  /**
   * Get barcode labels for an array of variant IDs.
   */
  async getLabelsForVariants(variantIds: string[]): Promise<BarcodeLabel[]> {
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: {
          include: {
            brand: true,
          },
        },
      },
    });

    if (variants.length === 0) {
      throw new NotFoundException('No variants found');
    }

    const labels: BarcodeLabel[] = [];

    for (const v of variants) {
      if (!v.barcode) continue;

      const barcodeDataUrl = await this.generateBarcodeImage(v.barcode);

      labels.push({
        variantId: v.id,
        productName: v.product.name,
        variantName: v.name,
        brandName: v.product.brand?.name || '',
        sku: v.sku,
        barcode: v.barcode,
        price: v.price,
        barcodeDataUrl,
      });
    }

    return labels;
  }

  /**
   * Get barcode labels for all variants of a product.
   */
  async getLabelsForProduct(productId: string): Promise<BarcodeLabel[]> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: { where: { isActive: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const variantIds = product.variants.map((v) => v.id);
    return this.getLabelsForVariants(variantIds);
  }

  /**
   * Get barcode labels for all variants in a specific store's inventory.
   */
  async getLabelsForStore(storeId: string): Promise<BarcodeLabel[]> {
    const inventories = await this.prisma.inventory.findMany({
      where: {
        warehouseId: storeId,
        available: { gt: 0 },
      },
      select: { variantId: true },
    });

    const variantIds = inventories.map((inv) => inv.variantId);
    return this.getLabelsForVariants(variantIds);
  }

  /**
   * Generate a single barcode PNG buffer for a variant (for direct download).
   */
  async generateBarcodePng(variantId: string): Promise<Buffer> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant || !variant.barcode) {
      throw new NotFoundException('Variant or barcode not found');
    }

    return this.safeGenerateBuffer(variant.barcode, {
      scale: 4,
      height: 15,
      includetext: false,
      textxalign: 'center',
      textsize: 10,
    });
  }
}
