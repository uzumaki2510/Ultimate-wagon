const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const logger = require('./config/logger');

const startServer = async () => {
  try {
    // Startup logging
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Port:', process.env.PORT);
    console.log('Frontend URL:', process.env.FRONTEND_URL);

    // Connect to MongoDB
    await connectDB();
    
    // Seed Super Admin if necessary
    const { seedSuperAdmin } = require('./scripts/seed');
    await seedSuperAdmin();

    // Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info(`
╔══════════════════════════════════════════════════╗
║       🚂  WAGON WHISPER API SERVER  🚂          ║
╠══════════════════════════════════════════════════╣
║  Environment : ${env.NODE_ENV.padEnd(32)}║
║  Port        : ${String(env.PORT).padEnd(32)}║
║  API URL     : http://localhost:${env.PORT}/api/v1${' '.repeat(7)}║
║  Health      : http://localhost:${env.PORT}/api/health${' '.repeat(4)}║
╚══════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force close after 10s
      setTimeout(() => {
        logger.error('Forceful shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (err) => {
      logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
      shutdown('UNHANDLED_REJECTION');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
      shutdown('UNCAUGHT_EXCEPTION');
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
