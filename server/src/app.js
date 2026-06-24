const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const routes = require('./routes');
const ApiError = require('./utils/ApiError');

const app = express();

// ── Security ─────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || env.FRONTEND_URL,
  credentials: true
}));

// ── Rate Limiting ────────────────────────────────────────
app.use('/api/', apiLimiter);

// ── Body Parsing ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Data Sanitization ────────────────────────────────────
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('./middleware/xss');

// Prevent NoSQL injection
app.use(mongoSanitize());
// Prevent XSS
app.use(xss);

// ── Logging ──────────────────────────────────────────────
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Health Check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Wagon Whisper API is running',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ───────────────────────────────────────────
app.use('/api/v1', routes);

// ── 404 Handler ──────────────────────────────────────────
app.use((req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

// ── Global Error Handler ─────────────────────────────────
app.use(errorHandler);

module.exports = app;
