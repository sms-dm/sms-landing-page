import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    // Check companies
    const companies = await prisma.company.findMany();
    console.log('\n=== Companies in database ===');
    console.log(companies);
    
    // Check for Oceanic specifically
    const oceanic = await prisma.company.findFirst({
      where: {
        OR: [
          { id: { contains: 'oceanic', mode: 'insensitive' } },
          { name: { contains: 'oceanic', mode: 'insensitive' } }
        ]
      }
    });
    
    if (oceanic) {
      console.log('\n✅ Oceanic company found:', oceanic);
    } else {
      console.log('\n❌ Oceanic company not found in database');
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();