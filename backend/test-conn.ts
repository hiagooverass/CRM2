import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const client = await prisma.client.findFirst();
    if (!client) {
      console.log('No client found');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    console.log('Testing with startDateStr:', startDateStr);

    const normalizeDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    };

    const startDate = normalizeDate(startDateStr);
    console.log('Normalized startDate:', startDate.toISOString());
    console.log('Today (local 00:00):', today.toISOString());
    console.log('Is startDate < today?', startDate < today);

    if (startDate < today) {
      console.log('Validation FAILED');
    } else {
      console.log('Validation PASSED');
    }

  } catch (e) {
    console.error('Failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
