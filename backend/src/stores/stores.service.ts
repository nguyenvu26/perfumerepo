import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRoleEnum } from '@prisma/client';
import { InventoryLogType } from '@prisma/client';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { BatchImportDto } from './dto/batch-import.dto';
import { BatchTransferDto } from './dto/batch-transfer.dto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  /** Admin: list all stores */
  async list() {
    return this.prisma.store.findMany({
      orderBy: { name: 'asc' },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
              },
            },
          },
        },
        _count: { select: { storeStocks: true, orders: true } },
      },
    });
  }

  /** Admin: create store */
  async create(dto: CreateStoreDto) {
    if (dto.code) {
      const existing = await this.prisma.store.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new BadRequestException('Store code already exists');
      }
    }
    return this.prisma.store.create({
      data: {
        name: dto.name,
        code: dto.code ?? undefined,
        address: dto.address,
        isActive: dto.isActive ?? true,
      },
    });
  }

  /** Admin: get one store */
  async getById(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
              },
            },
          },
        },
        storeStocks: {
          include: {
            variant: {
              include: {
                product: { select: { name: true, slug: true } },
              },
            },
          },
        },
      },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  /** Admin: update store */
  async update(id: string, dto: UpdateStoreDto) {
    await this.getById(id);
    if (dto.code) {
      const existing = await this.prisma.store.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (existing) {
        throw new BadRequestException('Store code already exists');
      }
    }
    return this.prisma.store.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        address: dto.address,
        isActive: dto.isActive,
      },
    });
  }

  /** Admin: delete store */
  async remove(id: string) {
    await this.getById(id);
    return this.prisma.store.delete({
      where: { id },
    });
  }

  /** Admin: assign staff to store */
  async assignStaff(storeId: string, userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) throw new NotFoundException('Store not found');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== UserRoleEnum.STAFF) {
      throw new BadRequestException(
        'User must have role STAFF to be assigned to a store',
      );
    }

    await this.prisma.userStore.upsert({
      where: {
        userId_storeId: { userId, storeId },
      },
      create: { userId, storeId },
      update: {},
    });
    return this.getById(storeId);
  }

  /** Admin: unassign staff from store */
  async unassignStaff(storeId: string, userId: string) {
    await this.prisma.userStore.deleteMany({
      where: { storeId, userId },
    });
    return this.getById(storeId);
  }

  /** Staff/Admin: list stores assigned to current user (for staff: their stores only) */
  async getStoresForUser(userId: string, role: string) {
    if (role === UserRoleEnum.ADMIN) {
      return this.prisma.store.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          code: true,
          address: true,
        },
      });
    }
    return this.prisma.store.findMany({
      where: {
        isActive: true,
        users: { some: { userId } },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
      },
    });
  }

  /** Ensure staff has access to store (throw if not) */
  async ensureStaffCanAccessStore(
    userId: string,
    storeId: string,
    role: string,
  ) {
    if (role === UserRoleEnum.ADMIN) return;
    const assigned = await this.prisma.userStore.findUnique({
      where: { userId_storeId: { userId, storeId } },
    });
    if (!assigned) {
      throw new ForbiddenException('You do not have access to this store');
    }
  }

  // ---------- Admin inventory: stock by store, import, transfer ----------

  /** Admin: overview stock by store (optional storeId to filter one store) */
  async getStockOverview(storeId?: string) {
    const where = storeId ? { storeId } : {};
    const storeStocks = await this.prisma.storeStock.findMany({
      where,
      include: {
        store: { select: { id: true, name: true, code: true } },
        variant: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                brand: { select: { name: true } },
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
      orderBy: [{ storeId: 'asc' }, { variantId: 'asc' }],
    });

    const byStore = new Map<
      string,
      {
        store: { id: string; name: string; code: string | null };
        variants: any[];
        totalUnits: number;
      }
    >();
    for (const ss of storeStocks) {
      const key = ss.storeId;
      if (!byStore.has(key)) {
        byStore.set(key, {
          store: ss.store,
          variants: [],
          totalUnits: 0,
        });
      }
      const entry = byStore.get(key)!;
      entry.variants.push({
        variantId: ss.variantId,
        variantName: ss.variant.name,
        productName: ss.variant.product.name,
        brandName: ss.variant.product.brand?.name ?? null,
        imageUrl: ss.variant.product.images?.[0]?.url ?? null,
        quantity: ss.quantity,
        updatedAt: ss.updatedAt,
      });
      entry.totalUnits += ss.quantity;
    }

    return {
      stores: Array.from(byStore.values()),
      summary: {
        totalStores: byStore.size,
        totalUnits: storeStocks.reduce((s, ss) => s + ss.quantity, 0),
      },
    };
  }

  /** Admin: import stock into a store (create or increment StoreStock) */
  async adminImportStock(
    storeId: string,
    variantId: string,
    quantity: number,
    staffId: string,
    reason?: string,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) throw new NotFoundException('Store not found');
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) throw new NotFoundException('Variant not found');

    if (variant.stock < quantity) {
      throw new BadRequestException(
        `Số lượng tồn kho tổng không đủ. (Hiện có: ${variant.stock}, yêu cầu: ${quantity})`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Decrement from central warehouse
      await tx.productVariant.update({
        where: { id: variantId },
        data: { stock: { decrement: quantity } },
      });

      // 2. Increment store stock
      await tx.storeStock.upsert({
        where: {
          storeId_variantId: { storeId, variantId },
        },
        create: { storeId, variantId, quantity },
        update: { quantity: { increment: quantity }, updatedAt: new Date() },
      });

      // 3. Log
      await tx.inventoryLog.create({
        data: {
          variantId,
          staffId,
          storeId,
          type: InventoryLogType.IMPORT,
          quantity,
          reason: reason ?? 'Admin import from warehouse',
        },
      });
    });
    return this.getStockOverview(storeId);
  }

  /** Admin: transfer stock between two stores */
  async transferStock(
    fromStoreId: string,
    toStoreId: string,
    variantId: string,
    quantity: number,
    staffId: string,
    reason?: string,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }
    if (fromStoreId === toStoreId) {
      throw new BadRequestException('From and to store must be different');
    }
    const [fromStore, toStore, variant] = await Promise.all([
      this.prisma.store.findUnique({ where: { id: fromStoreId } }),
      this.prisma.store.findUnique({ where: { id: toStoreId } }),
      this.prisma.productVariant.findUnique({ where: { id: variantId } }),
    ]);
    if (!fromStore) throw new NotFoundException('From store not found');
    if (!toStore) throw new NotFoundException('To store not found');
    if (!variant) throw new NotFoundException('Variant not found');

    const fromStock = await this.prisma.storeStock.findUnique({
      where: { storeId_variantId: { storeId: fromStoreId, variantId } },
    });
    const available = fromStock?.quantity ?? 0;
    if (available < quantity) {
      throw new BadRequestException(
        `Số lượng tồn tại quầy nguồn không đủ. (Hiện có: ${available}, yêu cầu: ${quantity})`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.storeStock.update({
        where: { storeId_variantId: { storeId: fromStoreId, variantId } },
        data: { quantity: { decrement: quantity }, updatedAt: new Date() },
      });
      await tx.storeStock.upsert({
        where: { storeId_variantId: { storeId: toStoreId, variantId } },
        create: { storeId: toStoreId, variantId, quantity },
        update: { quantity: { increment: quantity }, updatedAt: new Date() },
      });
      await tx.inventoryLog.create({
        data: {
          variantId,
          staffId,
          storeId: fromStoreId,
          type: InventoryLogType.ADJUST,
          quantity: -quantity,
          reason: reason ?? `Transfer to store ${toStore.name}`,
        },
      });
      await tx.inventoryLog.create({
        data: {
          variantId,
          staffId,
          storeId: toStoreId,
          type: InventoryLogType.IMPORT,
          quantity,
          reason: reason ?? `Transfer from store ${fromStore.name}`,
        },
      });
    });
    return this.getStockOverview();
  }

  // ---------- Session-based batch inventory ----------

  async batchImportStock(dto: BatchImportDto, userId: string, role: string) {
    await this.ensureStaffCanAccessStore(userId, dto.storeId, role);

    const items = (dto.items ?? [])
      .map((it) => ({
        variantId: it.variantId,
        quantity: Number(it.quantity),
      }))
      .filter(
        (it) => it.variantId && Number.isFinite(it.quantity) && it.quantity > 0,
      );

    if (items.length === 0) {
      // Avoid 400s for empty/unfinished UI inputs; treat as no-op.
      return this.getStockOverview(dto.storeId);
    }

    // Validate variants and check stock (single query)
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: items.map((i) => i.variantId) } },
      select: { id: true, stock: true },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v.stock]));
    
    const errors: string[] = [];
    for (const item of items) {
      if (!variantMap.has(item.variantId)) {
        errors.push(`Variant not found: ${item.variantId}`);
        continue;
      }
      const available = variantMap.get(item.variantId)!;
      if (available < item.quantity) {
        errors.push(
          `Sản phẩm ${item.variantId} không đủ tồn kho tổng. (Hiện có: ${available}, yêu cầu: ${item.quantity})`,
        );
      }
    }

    if (errors.length) {
      throw new BadRequestException(errors.join('; '));
    }

    await this.prisma.$transaction(async (tx) => {
      for (const it of items) {
        // 1. Decrement from central warehouse
        await tx.productVariant.update({
          where: { id: it.variantId },
          data: { stock: { decrement: it.quantity } },
        });

        // 2. Increment store stock
        await tx.storeStock.upsert({
          where: {
            storeId_variantId: {
              storeId: dto.storeId,
              variantId: it.variantId,
            },
          },
          create: {
            storeId: dto.storeId,
            variantId: it.variantId,
            quantity: it.quantity,
          },
          update: {
            quantity: { increment: it.quantity },
            updatedAt: new Date(),
          },
        });

        // 3. Log
        await tx.inventoryLog.create({
          data: {
            variantId: it.variantId,
            staffId: userId,
            storeId: dto.storeId,
            type: InventoryLogType.IMPORT,
            quantity: it.quantity,
            reason: dto.reason ?? 'Batch import from warehouse',
          },
        });
      }
    });

    return this.getStockOverview(dto.storeId);
  }

  async batchTransferStock(
    dto: BatchTransferDto,
    userId: string,
    role: string,
  ) {
    if (dto.fromStoreId === dto.toStoreId) {
      throw new BadRequestException('From and to store must be different');
    }

    await Promise.all([
      this.ensureStaffCanAccessStore(userId, dto.fromStoreId, role),
      this.ensureStaffCanAccessStore(userId, dto.toStoreId, role),
    ]);

    const items = (dto.items ?? [])
      .map((it) => ({
        variantId: it.variantId,
        quantity: Number(it.quantity),
      }))
      .filter(
        (it) => it.variantId && Number.isFinite(it.quantity) && it.quantity > 0,
      );

    if (items.length === 0) {
      return this.getStockOverview();
    }

    // Validate all variants exist
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: items.map((i) => i.variantId) } },
      select: { id: true },
    });
    const existing = new Set(variants.map((v) => v.id));
    const missing = items
      .filter((i) => !existing.has(i.variantId))
      .map((i) => i.variantId);
    if (missing.length) {
      throw new BadRequestException(`Variant not found: ${missing.join(', ')}`);
    }

    // Check availability for all items at source before transferring
    const sourceStocks = await this.prisma.storeStock.findMany({
      where: {
        storeId: dto.fromStoreId,
        variantId: { in: items.map((i) => i.variantId) },
      },
      select: { variantId: true, quantity: true },
    });
    const stockByVariant = new Map(
      sourceStocks.map((s) => [s.variantId, s.quantity]),
    );
    const insufficient: string[] = [];
    for (const it of items) {
      const available = stockByVariant.get(it.variantId) ?? 0;
      if (available < it.quantity) {
        insufficient.push(
          `${it.variantId} (available ${available}, requested ${it.quantity})`,
        );
      }
    }
    if (insufficient.length) {
      throw new BadRequestException(
        `Insufficient stock at source store for: ${insufficient.join('; ')}`,
      );
    }

    const [fromStore, toStore] = await Promise.all([
      this.prisma.store.findUnique({ where: { id: dto.fromStoreId } }),
      this.prisma.store.findUnique({ where: { id: dto.toStoreId } }),
    ]);
    if (!fromStore) throw new NotFoundException('From store not found');
    if (!toStore) throw new NotFoundException('To store not found');

    await this.prisma.$transaction(async (tx) => {
      for (const it of items) {
        await tx.storeStock.update({
          where: {
            storeId_variantId: {
              storeId: dto.fromStoreId,
              variantId: it.variantId,
            },
          },
          data: { quantity: { decrement: it.quantity }, updatedAt: new Date() },
        });
        await tx.storeStock.upsert({
          where: {
            storeId_variantId: {
              storeId: dto.toStoreId,
              variantId: it.variantId,
            },
          },
          create: {
            storeId: dto.toStoreId,
            variantId: it.variantId,
            quantity: it.quantity,
          },
          update: {
            quantity: { increment: it.quantity },
            updatedAt: new Date(),
          },
        });
        await tx.inventoryLog.create({
          data: {
            variantId: it.variantId,
            staffId: userId,
            storeId: dto.fromStoreId,
            type: InventoryLogType.ADJUST,
            quantity: -it.quantity,
            reason: dto.reason ?? `Batch transfer to store ${toStore.name}`,
          },
        });
        await tx.inventoryLog.create({
          data: {
            variantId: it.variantId,
            staffId: userId,
            storeId: dto.toStoreId,
            type: InventoryLogType.IMPORT,
            quantity: it.quantity,
            reason: dto.reason ?? `Batch transfer from store ${fromStore.name}`,
          },
        });
      }
    });

    return this.getStockOverview();
  }

  async lookupLoyaltyByPhone(phone: string) {
    const normalized = (phone ?? '').trim();
    if (!normalized) {
      throw new BadRequestException('Phone is required');
    }

    const user = await this.prisma.user.findFirst({
      where: { phone: normalized },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        loyaltyPoints: true,
      },
    });

    if (user) {
      return {
        registered: true,
        userId: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        loyaltyPoints: user.loyaltyPoints,
      };
    }

    const guestTransactions = await this.prisma.loyaltyTransaction.findMany({
      where: { phone: normalized, userId: null },
      select: { points: true },
    });
    const guestPoints = guestTransactions.reduce((sum, t) => sum + t.points, 0);

    return {
      registered: false,
      userId: null,
      fullName: null,
      phone: normalized,
      email: null,
      loyaltyPoints: guestPoints,
      transactionCount: guestTransactions.length,
    };
  }
}
