const User = require('../models/User');
const logger = require('../config/logger');

const seedSuperAdmin = async () => {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    logger.warn('SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set. Skipping Super Admin seed.');
    return;
  }

  try {
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      logger.info('Super Admin already exists. Skipping seed.');
      return;
    }

    await User.create({
      name: 'Super Admin',
      email,
      password,
      role: 'super_admin',
      status: 'approved',
      isActive: true,
      department: 'Admin',
      designation: 'Super Administrator',
      empCode: 'ADMIN-001'
    });

    logger.info('✅ Successfully seeded initial Super Admin.');
  } catch (error) {
    logger.error(`Error seeding Super Admin: ${error.message}`);
  }
};

module.exports = { seedSuperAdmin };
