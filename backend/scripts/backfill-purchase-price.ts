import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfill() {
    console.log('Starting backfill of purchasePrice for OrderItems...');

    const items = await prisma.orderItem.findMany({
        where: { purchasePrice: null },
        include: { variant: true }
    });

    console.log(`Found ${items.length} items to update.`);

    let count = 0;
    for (const item of items) {
        if (item.variant && item.variant.purchasePrice) {
            await prisma.orderItem.update({
                where: { id: item.id },
                data: { purchasePrice: item.variant.purchasePrice }
            });
            count++;
        }
    }

    console.log(`Successfully updated ${count} items.`);
    await prisma.$disconnect();
}

backfill().catch(e => {
    console.error(e);
    process.exit(1);
});
