import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const phone = '0962476192';
  const user = await prisma.user.findFirst({
    where: { phone },
    select: { id: true, fullName: true }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log(`User found: ${user.fullName} (${user.id})`);

  const promos = await prisma.userPromotion.findMany({
    where: {
      userId: user.id,
      status: 'UNUSED',
      promotion: {
        isActive: true,
        endDate: { gte: new Date() },
      }
    },
    include: {
      promotion: true
    }
  });

  console.log(`Found ${promos.length} UNUSED promotions`);
  promos.forEach(p => {
    console.log(`- ${p.promotion.code} (Expires: ${p.promotion.endDate})`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
