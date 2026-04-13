
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkReturn() {
  const id = 'cmnsmm7qd000bc8ogz062hgth';
  const ret = await prisma.returnRequest.findUnique({
    where: { id },
    include: { shipments: true, order: true }
  });
  console.log('Return Request:', JSON.stringify(ret, null, 2));
  process.exit(0);
}

checkReturn().catch(e => {
  console.error(e);
  process.exit(1);
});
