import { PrismaClient, WarehouseType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Inventory Migration...');

  // 1. Create or find the Central Warehouse
  let centralStore = await prisma.store.findFirst({
    where: { type: 'CENTRAL' },
  });

  if (!centralStore) {
    centralStore = await prisma.store.create({
      data: {
        name: 'Kho Tổng Trung Tâm',
        code: 'WH-CENTRAL',
        type: 'CENTRAL',
        address: 'Hồ Chí Minh',
        isActive: true,
      },
    });
    console.log(`Created Central Warehouse: ${centralStore.id}`);
  } else {
    console.log(`Found existing Central Warehouse: ${centralStore.id}`);
  }

  // Note: If you have already removed "stock" from schema.prisma, Prisma Client won't be able to read it.
  // To run this script, you must temporarily add back:
  // "stock Int @default(0)" in ProductVariant
  // and the entire "StoreStock" model in schema.prisma.
  
  /*
  // 2. Migrate ProductVariant.stock to Inventory
  console.log('Migrating Central Stock from ProductVariant...');
  const variants = await prisma.productVariant.findMany();
  let centralCount = 0;
  for (const v of variants) {
    if ((v as any).stock > 0) {
      await prisma.inventory.upsert({
        where: {
          warehouseId_variantId: {
            warehouseId: centralStore.id,
            variantId: v.id,
          },
        },
        create: {
          warehouseId: centralStore.id,
          variantId: v.id,
          onHand: (v as any).stock,
          available: (v as any).stock, // Initially available = onHand
          reserved: 0,
        },
        update: {
          onHand: (v as any).stock,
          available: (v as any).stock,
        },
      });
      centralCount++;
    }
  }
  console.log(`Migrated ${centralCount} variants to Central Warehouse.`);

  // 3. Migrate StoreStock to Inventory
  console.log('Migrating Store Stock...');
  // Type casting needed because StoreStock might be missing from Prisma Client if schema was updated.
  const storeStocks = await (prisma as any).storeStock.findMany();
  let storeCount = 0;
  for (const ss of storeStocks) {
    await prisma.inventory.upsert({
      where: {
        warehouseId_variantId: {
          warehouseId: ss.storeId,
          variantId: ss.variantId,
        },
      },
      create: {
        warehouseId: ss.storeId,
        variantId: ss.variantId,
        onHand: ss.quantity,
        available: ss.quantity,
        reserved: 0,
      },
      update: {
        onHand: ss.quantity,
        available: ss.quantity,
      },
    });
    storeCount++;
  }
  console.log(`Migrated ${storeCount} store stocks to Inventory.`);
  */

  console.log('Migration Completed! (Please uncomment the migration logic if "stock" and "StoreStock" are temporarily restored in schema.prisma)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
