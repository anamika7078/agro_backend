require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminSimple() {
  try {
    console.log('Creating admin user...');
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Create admin user data
    const adminData = {
      username: 'admin',
      email: 'admin@agrobilling.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Try to create admin using raw query to bypass transaction
    const result = await prisma.$executeRaw`
      INSERT INTO users (username, email, password, role, createdAt, updatedAt)
      VALUES (${adminData.username}, ${adminData.email}, ${adminData.password}, ${adminData.role}, ${adminData.createdAt}, ${adminData.updatedAt})
    `;
    
    console.log('✅ Admin user created successfully!');
    console.log('👤 Username: admin');
    console.log('🔐 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // If raw query fails, try using MongoDB directly
    try {
      console.log('Trying direct MongoDB approach...');
      const { MongoClient } = require('mongodb');
      const client = new MongoClient('mongodb://localhost:27017');
      
      await client.connect();
      const db = client.db('agro_billing');
      const users = db.collection('users');
      
      const existingAdmin = await users.findOne({ username: 'admin' });
      if (existingAdmin) {
        console.log('✅ Admin user already exists');
      } else {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        const admin = {
          username: 'admin',
          email: 'admin@agrobilling.com',
          password: hashedPassword,
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await users.insertOne(admin);
        console.log('✅ Admin user created successfully!');
        console.log('👤 Username: admin');
        console.log('🔐 Password: admin123');
      }
      
      await client.close();
    } catch (mongoError) {
      console.error('❌ MongoDB approach also failed:', mongoError.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdminSimple();
