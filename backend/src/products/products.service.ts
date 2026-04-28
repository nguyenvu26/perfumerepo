import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryLogType } from '@prisma/client';
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
    if (query.lowStock === 'true' || query.lowStock === true) {
      where.variants = {
        some: {
          stock: { lte: 10 },
          isActive: true,
        },
      };
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
      minPrice,
      maxPrice,
    } = query;

    const where: any = {
      isActive: true,
      // Only show products that have at least one active variant in stock
      variants: {
        some: {
          stock: { gt: 0 },
          isActive: true,
        },
      },
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

    if (scentFamilyId) {
      where.scentFamilyId = Number(scentFamilyId);
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      // Merge price filter into the existing variants.some filter
      where.variants.some.price = {
        gte: minPrice ? Number(minPrice) : undefined,
        lte: maxPrice ? Number(maxPrice) : undefined,
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
    let riskLevel = 0.3; // Default

    if (userId) {
      const prefs = await this.prisma.userAiPreference.findUnique({
        where: { userId },
      });
      if (prefs) {
        avoidedNotes = prefs.avoidedNotes || [];
        preferredNotes = prefs.preferredNotes || [];
        riskLevel = prefs.riskLevel ?? 0.3;
      }
    }

    // [MODIFIED] Disabled strict avoidance filtering at database level 
    // to allow Penalty System visualization on Mobile.
    /*
    if (avoidedNotes.length > 0) {
      where.AND.push({
        NOT: {
          notes: {
            some: {
              note: {
                OR: avoidedNotes.map((note) => ({
                  name: {
                    startsWith: note.split(' (')[0],
                    mode: 'insensitive',
                  },
                })),
              },
            },
          },
        },
      });
    }
    */

    // Strict Filter for "Classic" mode (Low Risk Level < 0.35)
    // If user has preferred notes and riskLevel is low, ONLY show matching products
    if (riskLevel < 0.35 && preferredNotes.length > 0) {
      where.AND.push({
        notes: {
          some: {
              note: {
                OR: preferredNotes.map((note) => ({
                  name: {
                    startsWith: note.split(' (')[0],
                    mode: 'insensitive',
                  },
                })),
              },
          },
        },
      });
    }

    // If we have preferred notes, we need to fetch more items to sort them by relevance
    // But for a basic implementation, we just fetch with pagination.
    // If scoring is critical, we'd fetch all and paginate in memory, which is what the previous code tried.
    // Let's improve it by only fetching everything if preferredNotes are actually present.
    
    // We only need to fetch all and re-sort if we're NOT in strict mode and HAVE preferred notes
    const shouldScoring = riskLevel >= 0.35 && preferredNotes.length > 0;

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
          const clean = (s: string) => s.split(' (')[0].toLowerCase().trim();
          const preferredCleans = preferredNotes.map(clean);

          const scoreA = a.notes.filter((pn) =>
            preferredCleans.includes(clean(pn.note.name)),
          ).length;
          const scoreB = b.notes.filter((pn) =>
            preferredCleans.includes(clean(pn.note.name)),
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
        scentFamily: true,
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

  async getTopSelling(take: number = 3) {
    const grouped = await this.prisma.orderItem.groupBy({
      by: ['variantId'],
      _sum: { quantity: true }
    });

    if (!grouped.length) {
      // Fallback to random or just isBestseller if no orders exist
      const fallback = await this.prisma.product.findMany({
        where: { isActive: true },
        include: {
          brand: true, category: true, scentFamily: true,
          images: { orderBy: { order: 'asc' } },
          variants: { where: { isActive: true } }
        },
        take,
      });
      return fallback.map(p => ({ ...p, salesCount: Math.floor(Math.random() * 500) + 50 }));
    }

    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: grouped.map(g => g.variantId) } },
      select: { id: true, productId: true }
    });

    const productSales = new Map<string, number>();
    grouped.forEach(g => {
      const variant = variants.find(v => v.id === g.variantId);
      if (variant) {
        const current = productSales.get(variant.productId) || 0;
        productSales.set(variant.productId, current + (g._sum.quantity || 0));
      }
    });

    const sortedProductIds = Array.from(productSales.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, take)
      .map(entry => entry[0]);

    const products = await this.prisma.product.findMany({
      where: { id: { in: sortedProductIds } },
      include: {
        brand: true, category: true, scentFamily: true,
        images: { orderBy: { order: 'asc' } },
        variants: { where: { isActive: true } },
        notes: { include: { note: true } }
      }
    });

    return sortedProductIds.map(id => {
      const p = products.find(prod => prod.id === id);
      return p ? { ...p, salesCount: productSales.get(id) } : null;
    }).filter(Boolean);
  }

  // Admin operations

  create(dto: CreateProductDto, userId?: string) {
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

      if (product.variants.length > 0 && userId) {
        for (const variant of product.variants) {
          if (variant.stock > 0) {
            await tx.inventoryLog.create({
              data: {
                variantId: variant.id,
                staffId: userId,
                type: InventoryLogType.IMPORT,
                quantity: variant.stock,
                reason: 'Initial stock on product creation',
              },
            });
          }
        }
      }

      return product;
    });
  }

  update(id: string, dto: UpdateProductDto, userId?: string) {
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

            const currentVariant = await tx.productVariant.findUnique({
              where: { id: variant.id },
            });

            if (currentVariant && currentVariant.stock !== variant.stock && userId) {
              await tx.inventoryLog.create({
                data: {
                  variantId: variant.id,
                  staffId: userId,
                  type: InventoryLogType.ADJUST,
                  quantity: variant.stock - currentVariant.stock,
                  reason: `Admin updated stock from ${currentVariant.stock} to ${variant.stock}`,
                },
              });
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
            const newVariant = await tx.productVariant.create({
              data: {
                productId: id,
                name: variant.name,
                sku: variant.sku ?? null,
                price: variant.price,
                stock: variant.stock,
                isActive: true,
              },
            });

            if (newVariant.stock > 0 && userId) {
              await tx.inventoryLog.create({
                data: {
                  variantId: newVariant.id,
                  staffId: userId,
                  type: InventoryLogType.IMPORT,
                  quantity: newVariant.stock,
                  reason: 'Initial stock for new variant',
                },
              });
            }
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

  async importToWarehouse(variantId: string, quantity: number, userId: string, reason?: string) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.update({
        where: { id: variantId },
        data: { stock: { increment: quantity } },
      });

      await tx.inventoryLog.create({
        data: {
          variantId,
          staffId: userId,
          type: InventoryLogType.IMPORT,
          quantity,
          reason: reason || 'Warehouse Restock',
        },
      });

      return variant;
    });
  }

  async getInventoryLogs(query: { variantId?: string; type?: any; skip?: number; take?: number }) {
    const { variantId, type, skip = 0, take = 20 } = query;
    const where: any = {};
    if (variantId) where.variantId = variantId;
    if (type) {
      if (type === 'SALE') {
        where.type = 'SALE_ONLINE';
      } else {
        where.type = type;
      }
    } else {
      where.type = { not: 'SALE_POS' };
    }

    const [items, total] = await Promise.all([
      this.prisma.inventoryLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: { take: 1 },
                  brand: true,
                },
              },
            },
          },
          staff: {
            select: { fullName: true, email: true },
          },
        },
      }),
      this.prisma.inventoryLog.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  async adminStats() {
    const [
      totalProducts,
      activeProducts,
      totalStock,
      lowStockVariants,
      outOfStockVariants,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.productVariant.aggregate({
        _sum: { stock: true },
      }),
      this.prisma.productVariant.count({
        where: {
          stock: { lte: 10, gt: 0 },
          isActive: true,
        },
      }),
      this.prisma.productVariant.count({
        where: {
          stock: 0,
          isActive: true,
        },
      }),
    ]);

    return {
      totalProducts,
      activeProducts,
      inactiveProducts: totalProducts - activeProducts,
      totalStock: totalStock._sum.stock || 0,
      lowStockVariants,
      outOfStockVariants,
    };
  }
}
