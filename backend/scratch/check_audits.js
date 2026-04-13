
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAudits() {
  const id = 'cmnsmm7qd000bc8ogz062hgth';
  const audits = await prisma.returnAudit.findMany({
    where: { returnId: id },
    orderBy: { createdAt: 'desc' }
  });
  console.log('Audits:', JSON.stringify(audits, null, 2));
  process.exit(0);
}

checkAudits().catch(e => {
  console.error(e);
  process.exit(1);
});
