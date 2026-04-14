import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orderCode = 'ORD-1776016850283';
  console.log(`Checking order: ${orderCode}`);
  
  const order = await prisma.order.findUnique({
    where: { code: orderCode },
    include: { items: true },
  });

  if (!order) {
    console.error('Order not found');
    return;
  }

  console.log(`- Total: ${order.totalAmount}, Discount: ${order.discountAmount}, Final: ${order.finalAmount}`);
  console.log('Order Items:');
  order.items.forEach(item => {
    console.log(`- Item ID: ${item.id}, VariantID: ${item.variantId}, UnitPrice: ${item.unitPrice}, Qty: ${item.quantity}, Total: ${item.totalPrice}`);
  });

  const returns = await prisma.returnRequest.findMany({
    where: { orderId: order.id },
    include: { items: true },
  });

  console.log('\nReturn Requests:');
  returns.forEach(ret => {
    console.log(`- Return ID: ${ret.id}, TotalAmount: ${ret.totalAmount}, Status: ${ret.status}`);
    ret.items.forEach(ri => {
      console.log(`  - Return Item: VariantID: ${ri.variantId}, QTY: ${ri.quantity}`);
    });
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
