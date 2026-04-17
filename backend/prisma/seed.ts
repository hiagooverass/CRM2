import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {},
    create: {
      email: 'admin@crm.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Admin user created:', admin.email);

  // Create some mock clients
  for (const client of [
    {
      name: 'João Silva',
      document: '12345678901',
      type: 'PF',
      score: 85,
      classification: 'ALTO',
      scoreReasons: JSON.stringify(['Bom pagador']),
    },
    {
      name: 'Tech Solutions LTDA',
      document: '12345678000199',
      type: 'PJ',
      score: 45,
      classification: 'MEDIO',
      scoreReasons: JSON.stringify(['Empresa recente']),
    }
  ]) {
    await prisma.client.upsert({
      where: { document: client.document },
      update: {},
      create: client,
    });
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
