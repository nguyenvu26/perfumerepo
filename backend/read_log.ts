import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const lastLog = await prisma.aiRequestLog.findFirst({
    where: { type: 'STAFF_POS_CONSULT' },
    orderBy: { createdAt: 'desc' }
  });
  if (lastLog) {
    console.log('--- Request ---');
    console.log(lastLog.request);
    console.log('--- Response (Len: ' + (lastLog.response?.length ?? 0) + ') ---');
    console.log(lastLog.response);
  } else {
    console.log('No logs found');
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
