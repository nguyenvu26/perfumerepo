import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.product.count({where: {isActive: true}});
  const v = await prisma.productVariant.count({where: {isActive: true, stock: {gt: 0}}});
  console.log(`Products: ${c}, Available variants: ${v}`);
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
