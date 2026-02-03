const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    if (adminUser) {
      console.log('✅ Admin user found:', adminUser.username);
      console.log('📧 Email:', adminUser.email);
      console.log('🆔 ID:', adminUser.id);
    } else {
      console.log('❌ Admin user not found');
      
      // Create admin user
      console.log('Creating admin user...');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const newAdmin = await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@agrobilling.com',
          password: hashedPassword,
          role: 'admin'
        }
      });
      
      console.log('✅ Admin user created successfully');
      console.log('📧 Email:', newAdmin.email);
      console.log('🆔 ID:', newAdmin.id);
    }
    
    // Test login with password verification
    const bcrypt = require('bcryptjs');
    const testPassword = 'admin123';
    const isMatch = await bcrypt.compare(testPassword, adminUser.password);
    console.log('🔐 Password verification test:', isMatch ? '✅ Success' : '❌ Failed');
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
