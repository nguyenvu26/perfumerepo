import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryLogType, InventoryRequestStatus } from '@prisma/client';
import { StoresService } from '../stores/stores.service';
import { InventoryGateway } from './inventory.gateway';

@Injectable()
export class StaffInventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storesService: StoresService,
    private readonly inventoryGateway: InventoryGateway,
  ) {}

  /** List inventory overview for a store (StoreStock). storeId required for staff. */
  async listOverview(storeId: string, userId: string, role: string) {
    await this.storesService.ensureStaffCanAccessStore(userId, storeId, role);

    const storeStocks = await this.prisma.storeStock.findMany({
      where: { storeId },
      include: {
        variant: {
          include: {
            product: {
              include: {
                brand: true,
                images: {
                  select: { url: true },
                  orderBy: { order: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: [{ quantity: 'asc' }, { updatedAt: 'desc' }],
      take: 200,
    });

    const totalUnits = storeStocks.reduce((s, ss) => s + ss.quantity, 0);
    const lowStockThreshold = 5;
    const lowStockCount = storeStocks.filter(
      (ss) => ss.quantity > 0 && ss.quantity <= lowStockThreshold,
    ).length;

    const latestImport = await this.prisma.inventoryLog.findFirst({
      where: { storeId, type: InventoryLogType.IMPORT },
      orderBy: { createdAt: 'desc' },
    });

    return {
      storeId,
      stats: {
        totalUnits,
        lowStockCount,
        latestImportAt: latestImport?.createdAt ?? null,
      },
      variants: storeStocks.map((ss) => ({
        id: ss.variantId,
        name: ss.variant.product.name,
        brand: ss.variant.product.brand?.name ?? null,
        variantName: ss.variant.name,
        imageUrl: ss.variant.product.images?.[0]?.url ?? null,
        stock: ss.quantity,
        updatedAt: ss.updatedAt,
      })),
    };
  }

  async importStock(
    storeId: string,
    staffId: string,
    variantId: string,
    quantity: number,
    userId: string,
    role: string,
    reason?: string,
  ) {
    await this.storesService.ensureStaffCanAccessStore(userId, storeId, role);
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) {
      throw new BadRequestException('Variant not found');
    }

    const request = await this.prisma.inventoryRequest.create({
      data: {
        storeId,
        variantId,
        staffId,
        type: InventoryLogType.IMPORT,
        quantity,
        reason,
      },
      include: {
        variant: {
          include: {
            product: {
              include: {
                brand: true,
                images: { select: { url: true }, take: 1, orderBy: { order: 'asc' } },
              },
            },
          },
        },
        store: true,
        staff: { select: { id: true, fullName: true, email: true } },
      },
    });

    return this.formatRequest(request);
  }

  async adjustStock(
    storeId: string,
    staffId: string,
    variantId: string,
    delta: number,
    userId: string,
    role: string,
    reason: string,
  ) {
    await this.storesService.ensureStaffCanAccessStore(userId, storeId, role);
    if (delta === 0) {
      throw new BadRequestException('Delta must be non-zero');
    }

    const request = await this.prisma.inventoryRequest.create({
      data: {
        storeId,
        variantId,
        staffId,
        type: InventoryLogType.ADJUST,
        quantity: delta,
        reason: reason || 'Adjustment',
      },
      include: {
        variant: {
          include: {
            product: {
              include: {
                brand: true,
                images: { select: { url: true }, take: 1, orderBy: { order: 'asc' } },
              },
            },
          },
        },
        store: true,
        staff: { select: { id: true, fullName: true, email: true } },
      },
    });

    return this.formatRequest(request);
  }

  /** Staff: list my own inventory requests */
  async listMyRequests(userId: string, role: string, storeId?: string) {
    const where: any = { staffId: userId };
    if (storeId) {
      await this.storesService.ensureStaffCanAccessStore(userId, storeId, role);
      where.storeId = storeId;
    }

    const requests = await this.prisma.inventoryRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        variant: {
          include: {
            product: {
              include: {
                brand: true,
                images: { select: { url: true }, take: 1, orderBy: { order: 'asc' } },
              },
            },
          },
        },
        store: true,
        staff: { select: { id: true, fullName: true, email: true } },
        reviewer: { select: { id: true, fullName: true, email: true } },
      },
    });

    return requests.map((r) => this.formatRequest(r));
  }

  /** Search all active system products with their variants (for import) */
  async searchAllVariants(q?: string) {
    const where: any = { isActive: true };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { name: { contains: q, mode: 'insensitive' } } },
        { variants: { some: { name: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const products = await this.prisma.product.findMany({
      where,
      take: 50,
      include: {
        brand: { select: { name: true } },
        images: { select: { url: true }, orderBy: { order: 'asc' }, take: 1 },
        variants: {
          where: { isActive: true },
          select: { id: true, name: true, sku: true, price: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return products.flatMap((p) =>
      p.variants.map((v) => ({
        variantId: v.id,
        productName: p.name,
        variantName: v.name,
        brand: p.brand?.name ?? null,
        sku: v.sku,
        price: v.price,
        imageUrl: p.images?.[0]?.url ?? null,
      })),
    );
  }

  /** Admin: list all inventory requests (optionally filtered) */
  async listAllRequests(params: {
    status?: string;
    storeId?: string;
    staffId?: string;
  }) {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.storeId) where.storeId = params.storeId;
    if (params.staffId) where.staffId = params.staffId;

    const requests = await this.prisma.inventoryRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        variant: {
          include: {
            product: {
              include: {
                brand: true,
                images: {
                  select: { url: true },
                  orderBy: { order: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
        store: true,
        staff: { select: { id: true, fullName: true, email: true } },
        reviewer: { select: { id: true, fullName: true, email: true } },
      },
    });

    return requests.map((r) => this.formatRequest(r));
  }

  /** Admin: approve an inventory request */
  async approveRequest(requestId: number, adminId: string, note?: string) {
    const request = await this.prisma.inventoryRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== InventoryRequestStatus.PENDING) {
      throw new BadRequestException(
        'Request is already ' + request.status.toLowerCase(),
      );
    }

    // For ADJUST, validate resulting stock won't be negative
    if (request.type === InventoryLogType.ADJUST) {
      const current = await this.prisma.storeStock.findUnique({
        where: {
          storeId_variantId: {
            storeId: request.storeId,
            variantId: request.variantId,
          },
        },
      });
      const currentQty = current?.quantity ?? 0;
      const newQty = currentQty + request.quantity;
      if (newQty < 0) {
        throw new BadRequestException(
          `Cannot approve: resulting stock would be ${newQty} (current: ${currentQty}, delta: ${request.quantity})`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // Update request status
      await tx.inventoryRequest.update({
        where: { id: requestId },
        data: {
          status: InventoryRequestStatus.APPROVED,
          reviewedBy: adminId,
          reviewNote: note,
          reviewedAt: new Date(),
        },
      });

      // Apply stock change
      if (request.type === InventoryLogType.IMPORT) {
        await tx.storeStock.upsert({
          where: {
            storeId_variantId: {
              storeId: request.storeId,
              variantId: request.variantId,
            },
          },
          create: {
            storeId: request.storeId,
            variantId: request.variantId,
            quantity: request.quantity,
          },
          update: {
            quantity: { increment: request.quantity },
            updatedAt: new Date(),
          },
        });
      } else {
        // ADJUST
        const current = await tx.storeStock.findUnique({
          where: {
            storeId_variantId: {
              storeId: request.storeId,
              variantId: request.variantId,
            },
          },
        });
        const newQty = (current?.quantity ?? 0) + request.quantity;
        await tx.storeStock.upsert({
          where: {
            storeId_variantId: {
              storeId: request.storeId,
              variantId: request.variantId,
            },
          },
          create: {
            storeId: request.storeId,
            variantId: request.variantId,
            quantity: newQty,
          },
          update: { quantity: newQty, updatedAt: new Date() },
        });
      }

      // Write inventory log
      await tx.inventoryLog.create({
        data: {
          variantId: request.variantId,
          staffId: request.staffId,
          storeId: request.storeId,
          type: request.type,
          quantity: request.quantity,
          reason: `[Approved by admin] ${request.reason || ''}`.trim(),
        },
      });
    });

    // Real-time notify staff
    this.inventoryGateway.notifyRequestReviewed(request.staffId, {
      id: request.id,
      status: 'APPROVED',
      reviewNote: note ?? null,
      storeId: request.storeId,
    });

    return { success: true, message: 'Request approved and stock updated' };
  }

  /** Admin: reject an inventory request */
  async rejectRequest(requestId: number, adminId: string, note: string) {
    const request = await this.prisma.inventoryRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== InventoryRequestStatus.PENDING) {
      throw new BadRequestException(
        'Request is already ' + request.status.toLowerCase(),
      );
    }

    await this.prisma.inventoryRequest.update({
      where: { id: requestId },
      data: {
        status: InventoryRequestStatus.REJECTED,
        reviewedBy: adminId,
        reviewNote: note,
        reviewedAt: new Date(),
      },
    });

    // Real-time notify staff
    this.inventoryGateway.notifyRequestReviewed(request.staffId, {
      id: request.id,
      status: 'REJECTED',
      reviewNote: note,
      storeId: request.storeId,
    });

    return { success: true, message: 'Request rejected' };
  }

  /** Format an inventory request for API response */
  private formatRequest(r: any) {
    return {
      id: r.id,
      type: r.type,
      quantity: r.quantity,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
      reviewedAt: r.reviewedAt,
      reviewNote: r.reviewNote,
      store: { id: r.store.id, name: r.store.name, code: r.store.code },
      product: r.variant?.product?.name ?? null,
      brand: r.variant?.product?.brand?.name ?? null,
      variantId: r.variantId,
      variantName: r.variant?.name ?? null,
      imageUrl: r.variant?.product?.images?.[0]?.url ?? null,
      staff: r.staff
        ? { id: r.staff.id, name: r.staff.fullName, email: r.staff.email }
        : null,
      reviewer: r.reviewer
        ? {
            id: r.reviewer.id,
            name: r.reviewer.fullName,
            email: r.reviewer.email,
          }
        : null,
    };
  }

  async getLogs(
    params: {
      storeId?: string;
      variantId?: string;
      from?: string;
      to?: string;
    },
    userId: string,
    role: string,
  ) {
    const where: any = {};
    if (params.storeId) {
      await this.storesService.ensureStaffCanAccessStore(
        userId,
        params.storeId,
        role,
      );
      where.storeId = params.storeId;
    }
    if (params.variantId) where.variantId = params.variantId;
    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) where.createdAt.gte = new Date(params.from);
      if (params.to) where.createdAt.lte = new Date(params.to);
    }

    const logs = await this.prisma.inventoryLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        variant: {
          include: {
            product: {
              include: {
                images: { select: { url: true }, take: 1, orderBy: { order: 'asc' } },
              },
            },
          },
        },
        staff: true,
        store: true,
      },
    });
    return logs;
  }
}
