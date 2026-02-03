// This script bypasses Prisma transactions for local MongoDB
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function createAdminUser() {
  const client = new MongoClient(process.env.DATABASE_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const users = db.collection('users');
    
    // Check if admin exists
    const existingAdmin = await users.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.username);
      return;
    }
    
    // Create admin user
    const bcrypt = require('bcryptjs');
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
    
    const result = await users.insertOne(admin);
    console.log('✅ Admin user created successfully!');
    console.log('🆔 Admin ID:', result.insertedId);
    console.log('👤 Username: admin');
    console.log('🔐 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

createAdminUser();
