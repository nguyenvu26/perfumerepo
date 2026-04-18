import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

import { AiService } from '../ai/ai.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly aiService: AiService,
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

  async listPublic(query: QueryProductsDto, userId?: string) {
    const {
      search,
      skip = 0,
      take = 20,
      brandId,
      categoryId,
      scentFamilyId,
      isFeatured,
      isBestseller,
      notes,
      occasion,
      minPrice,
      maxPrice,
    } = query;

    const where: any = {
      isActive: true,
      AND: [],
    };

    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { scentFamily: { name: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    if (notes) {
      where.AND.push({
        OR: [
          {
            notes: {
              some: {
                note: { name: { contains: notes, mode: 'insensitive' } },
              },
            },
          },
          {
            scentFamily: { name: { contains: notes, mode: 'insensitive' } },
          },
        ],
      });
    }

    if (occasion) {
      where.AND.push({
        OR: [
          { name: { contains: occasion, mode: 'insensitive' } },
          { description: { contains: occasion, mode: 'insensitive' } },
        ],
      });
    }

    if (scentFamilyId) {
      where.scentFamilyId = Number(scentFamilyId);
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.variants = {
        some: {
          price: {
            gte: minPrice ? Number(minPrice) : undefined,
            lte: maxPrice ? Number(maxPrice) : undefined,
          },
          isActive: true,
        },
      };
    }

    if (brandId) {
      where.brandId = Number(brandId);
    }

    if (categoryId) {
      where.categoryId = Number(categoryId);
    }

    if (isFeatured === 'true' || isFeatured === true) {
      where.isFeatured = true;
    }

    if (isBestseller === 'true' || isBestseller === true) {
      where.isBestseller = true;
    }

    // AI DNA Filtering
    let avoidedNotes: string[] = [];
    let preferredNotes: string[] = [];

    if (userId) {
      const prefs = await this.prisma.userAiPreference.findUnique({
        where: { userId },
      });
      if (prefs) {
        avoidedNotes = prefs.avoidedNotes || [];
        preferredNotes = prefs.preferredNotes || [];
      }
    }

    if (avoidedNotes.length > 0) {
      where.NOT = {
        notes: {
          some: {
            note: {
              name: {
                in: avoidedNotes,
                mode: 'insensitive',
              },
            },
          },
        },
      };
    }

    // If we have preferred notes, we need to fetch more items to sort them by relevance
    // But for a basic implementation, we just fetch with pagination.
    // If scoring is critical, we'd fetch all and paginate in memory, which is what the previous code tried.
    // Let's improve it by only fetching everything if preferredNotes are actually present.

    const shouldScoring = preferredNotes.length > 0;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
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
        // Only skip/take in DB if we don't need to re-sort everything in memory
        skip: shouldScoring ? undefined : Number(skip),
        take: shouldScoring ? undefined : Number(take),
      }),
      this.prisma.product.count({ where }),
    ]);

    let finalItems = items;

    if (shouldScoring) {
      finalItems = items
        .sort((a, b) => {
          const scoreA = a.notes.filter((pn) =>
            preferredNotes.some(
              (un) => un.toLowerCase() === pn.note.name.toLowerCase(),
            ),
          ).length;
          const scoreB = b.notes.filter((pn) =>
            preferredNotes.some(
              (un) => un.toLowerCase() === pn.note.name.toLowerCase(),
            ),
          ).length;
          return scoreB - scoreA;
        })
        .slice(Number(skip), Number(skip) + Number(take));
    }

    return {
      items: finalItems,
      total,
      skip: Number(skip),
      take: Number(take),
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

    // On-demand AI Scent Analysis generation
    if (!product.scentAnalysis) {
      this.aiService.generateProductScentAnalysis(id).catch((err) => {
        console.error('Failed to generate on-demand AI scent analysis:', err);
      });
    }

    return product;
  }

  // Admin operations

  create(dto: CreateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      const { variants, scentNotes, ...productData } = dto;
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

      if (scentNotes && scentNotes.length > 0) {
        for (const sn of scentNotes) {
          const note = await tx.scentNote.upsert({
            where: { name_type: { name: sn.name, type: sn.type } },
            update: {},
            create: { name: sn.name, type: sn.type },
          });
          await tx.productScentNote.create({
            data: { productId: product.id, noteId: note.id },
          });
        }
      }

      return product;
    });
  }

  update(id: string, dto: UpdateProductDto) {
    return this.prisma.$transaction(async (tx) => {
      const { variants, scentNotes, ...productData } = dto;

      const product = await tx.product.update({
        where: { id },
        data: productData,
      });

      if (scentNotes) {
        // Clear old ones
        await tx.productScentNote.deleteMany({ where: { productId: id } });

        // Add new ones
        for (const sn of scentNotes) {
          const note = await tx.scentNote.upsert({
            where: { name_type: { name: sn.name, type: sn.type } },
            update: {},
            create: { name: sn.name, type: sn.type },
          });
          await tx.productScentNote.create({
            data: { productId: id, noteId: note.id },
          });
        }
      }

      if (variants) {
        const existingVariants = await tx.productVariant.findMany({
          where: { productId: id },
          select: { id: true },
        });
        const existingIds = new Set(existingVariants.map((v) => v.id));
        const incomingIds = new Set(
          variants.map((v) => v.id).filter((variantId): variantId is string => Boolean(variantId)),
        );

        // Variants removed from the form are soft-disabled to preserve relations.
        const removedIds = [...existingIds].filter(
          (variantId) => !incomingIds.has(variantId),
        );
        if (removedIds.length > 0) {
          await tx.productVariant.updateMany({
            where: { id: { in: removedIds } },
            data: { isActive: false },
          });
        }

        for (const variant of variants) {
          if (variant.id) {
            if (!existingIds.has(variant.id)) {
              throw new NotFoundException('Variant not found');
            }
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                name: variant.name,
                sku: variant.sku ?? null,
                price: variant.price,
                stock: variant.stock,
                isActive: true,
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: id,
                name: variant.name,
                sku: variant.sku ?? null,
                price: variant.price,
                stock: variant.stock,
                isActive: true,
              },
            });
          }
        }
      }

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
