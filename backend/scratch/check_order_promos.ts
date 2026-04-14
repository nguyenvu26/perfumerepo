import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orderCode = 'ORD-1776016850283';
  const order = await prisma.order.findUnique({
    where: { code: orderCode },
    include: { promotions: true, items: true },
  });

  if (!order) {
    console.error('Order not found');
    return;
  }

  console.log(`Order Code: ${order.code}`);
  console.log(`Total Amount (Subtotal): ${order.totalAmount}`);
  console.log(`Discount Amount: ${order.discountAmount}`);
  console.log(`Shipping Fee: ${order.shippingFee}`);
  console.log(`Final Amount (Paid): ${order.finalAmount}`);
  
  console.log('\nApplied Promotions:');
  order.promotions.forEach(p => {
    console.log(`- Promotion: ${p.promotionCodeId}, Discount: ${p.discountAmount}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
