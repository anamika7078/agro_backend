require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDB() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    
    const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (admin) {
      console.log('✅ Admin exists:', admin.username);
    } else {
      console.log('❌ Admin not found');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();
