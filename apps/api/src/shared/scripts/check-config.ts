import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkConfig() {
  const configs = await prisma.systemConfig.findMany();
  console.log('--- System Config ---');
  configs.forEach(c => {
    console.log(`${c.key}: ${JSON.stringify(c.value)}`);
  });
  await prisma.$disconnect();
}

checkConfig();
