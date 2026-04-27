import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const userId = 'cmo8wqfss0000pp01ckczphdp';
  
  // 1. Update avoidedNotes to include 'Black pepper'
  await prisma.userAiPreference.update({
    where: { userId },
    data: { avoidedNotes: ['Black pepper'] }
  });
  
  // 2. Mock listPublic logic
  const avoidedNotes = ['Black pepper'];
  const preferredNotes = ['Almond (h?nh nhân)', 'Amber (h? phách)', 'Ambrette (x? huong th?c v?t)', 'Ambroxan (signature)', 'Artemisia', 'Black pepper'];
  const riskLevel = 0.3;

  const where: any = {
    isActive: true,
    AND: []
  };

  if (avoidedNotes.length > 0) {
    where.AND.push({
      NOT: {
        notes: {
          some: {
            note: {
              name: {
                in: avoidedNotes,
                mode: 'insensitive',
              },
            },
          },
        },
      },
    });
  }

  if (riskLevel < 0.35 && preferredNotes.length > 0) {
    where.AND.push({
      notes: {
        some: {
          note: {
            name: {
              in: preferredNotes,
              mode: 'insensitive',
            },
          },
        },
      },
    });
  }

  const items = await prisma.product.findMany({
    where,
    include: { notes: { include: { note: true } } }
  });

  console.log('Results with avoided Black pepper:');
  items.forEach(p => console.log(p.name));
  
  const hasTRex = items.some(p => p.name === 'Zoologist T-Rex');
  console.log('Has Zoologist T-Rex:', hasTRex);
}
main().catch(console.error).finally(() => prisma.$disconnect());
