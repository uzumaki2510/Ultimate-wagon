/**
 * Seed script — creates a default Admin user for testing.
 * Run: node src/seed.js
 */
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const logger = require('./config/logger');

const seedAdmin = async () => {
  try {
    await connectDB();

    const existing = await User.findOne({ email: 'admin@wagonwhisper.com' });
    if (existing) {
      logger.info('Admin user already exists. Skipping seed.');
      process.exit(0);
    }

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@wagonwhisper.com',
      password: 'Admin@123',
      role: 'Admin',
      empCode: 'ADM001',
      designation: 'System Administrator',
      department: 'IT',
    });

    logger.info(`✅ Admin user created successfully:`);
    logger.info(`   Email:    admin@wagonwhisper.com`);
    logger.info(`   Password: Admin@123`);
    logger.info(`   Role:     Admin`);
    logger.info(`   ID:       ${admin._id}`);

    // Create a few sample users
    const sampleUsers = [
      { name: 'Rajesh Kumar', email: 'sse@wagonwhisper.com', password: 'Sse@123', role: 'SSE', empCode: 'SSE001', designation: 'Senior Section Engineer', department: 'C&W' },
      { name: 'Amit Singh', email: 'je@wagonwhisper.com', password: 'Je@1234', role: 'JE', empCode: 'JE001', designation: 'Junior Engineer', department: 'C&W' },
      { name: 'Suresh Patel', email: 'supervisor@wagonwhisper.com', password: 'Sup@123', role: 'Supervisor', empCode: 'SUP001', designation: 'Supervisor', department: 'Maintenance' },
      { name: 'Ravi Sharma', email: 'tech@wagonwhisper.com', password: 'Tech@123', role: 'Technician', empCode: 'TECH001', designation: 'Technician', department: 'Maintenance' },
      { name: 'Viewer User', email: 'viewer@wagonwhisper.com', password: 'View@123', role: 'Viewer', empCode: 'VW001', designation: 'Viewer', department: 'Operations' },
    ];

    for (const userData of sampleUsers) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        await User.create(userData);
        logger.info(`   Created: ${userData.name} (${userData.role})`);
      }
    }

    logger.info(`\n✅ Seed completed. ${sampleUsers.length + 1} users created.`);
    process.exit(0);
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
