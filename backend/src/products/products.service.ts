import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async list(query: QueryProductsDto) {
    const { search, skip = 0, take = 20, brandId, categoryId } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (brandId) {
      where.brandId = brandId;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          brand: true,
          category: true,
          scentFamily: true,
          images: {
            orderBy: { order: 'asc' },
          },
          variants: true,
          notes: { include: { note: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      total,
      skip,
      take,
    };
  }

  async listPublic(query: QueryProductsDto) {
    const { search, skip = 0, take = 20, brandId, categoryId, isFeatured, isBestseller } = query;

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (brandId) {
      where.brandId = brandId;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (isFeatured === 'true' || isFeatured === true) {
      where.isFeatured = true;
    }
    if (isBestseller === 'true' || isBestseller === true) {
      where.isBestseller = true;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          brand: true,
          category: true,
          scentFamily: true,
          images: {
            orderBy: { order: 'asc' },
          },
          variants: {
            where: { isActive: true },
          },
          notes: { include: { note: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      total,
      skip,
      take,
    };
  }

  async getPublicById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        category: true,
        images: {
          orderBy: { order: 'asc' },
        },
        variants: {
          where: { isActive: true },
        },
        reviews: true,
        notes: {
          include: {
            note: true,
          },
        },
      },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  // Admin operations

  create(dto: CreateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      const { variants, ...productData } = dto;
      const product = await tx.product.create({
        data: {
          ...productData,
          isActive: dto.isActive ?? true,
          variants: {
            create: variants,
          },
        },
        include: {
          variants: true,
        },
      });

      return product;
    });
  }

  update(id: string, dto: UpdateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      const { variants, ...productData } = dto;

      const product = await tx.product.update({
        where: { id },
        data: {
          ...productData,
          // Note: Full variant sync can be complex, for now we just update basic fields.
          // Management of variants (add/remove) can be handled by a separate logic if needed.
        },
      });

      return product;
    });
  }

  async remove(id: string) {
    // Get all images to delete from Cloudinary
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (product && product.images.length > 0) {
      const publicIds = product.images.map((img) => img.publicId);
      await this.cloudinaryService.deleteImages(publicIds);
    }

    await this.prisma.product.delete({
      where: { id },
    });
    return { success: true };
  }

  async uploadImages(
    productId: string,
    files: Express.Multer.File[],
    orders?: number[],
  ) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check total images limit (max 10)
    const currentImageCount = product.images.length;
    if (currentImageCount + files.length > 10) {
      throw new Error(
        `Cannot upload more than 10 images. Current: ${currentImageCount}, Trying to add: ${files.length}`,
      );
    }

    // Upload images to Cloudinary
    const uploadResults = await this.cloudinaryService.uploadImages(
      files.map((f) => f.buffer),
      `perfume-gpt/products/${productId}`,
    );

    // Save to database
    const imageData = uploadResults.map((result, index) => ({
      productId,
      url: result.url,
      publicId: result.publicId,
      order: orders && orders[index] !== undefined ? orders[index] : index,
    }));

    const createdImages = await this.prisma.productImage.createMany({
      data: imageData,
    });

    // Return updated product with images
    return this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async deleteImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: {
        id: Number(imageId),
        productId,
      },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    // Delete from Cloudinary
    await this.cloudinaryService.deleteImage(image.publicId);

    // Delete from database
    await this.prisma.productImage.delete({
      where: { id: Number(imageId) },
    });

    return { success: true };
  }
}
