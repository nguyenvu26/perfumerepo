import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    include: { items: true },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  console.log('Recent Orders:');
  orders.forEach(o => {
    console.log(`- Code: ${o.code}, Paid: ${o.finalAmount}, Total: ${o.totalAmount}, Discount: ${o.discountAmount}, Shipping: ${o.shippingFee}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
