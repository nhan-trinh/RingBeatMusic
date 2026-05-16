import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=1',
    },
  },
});

async function testUpsert() {
  const finalUrl = 'https://example.com/test-bg.png';
  try {
    const res = await prisma.systemConfig.upsert({
      where: { key: 'hero_background_url' },
      update: { value: finalUrl },
      create: { key: 'hero_background_url', value: finalUrl },
    });
    console.log('Upsert successful:', res);
  } catch (error) {
    console.error('Upsert failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpsert();
