require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
const cron = require('node-cron');

// Import routes
const logRoutes = require('./routes/logRoutes');
const ruleRoutes = require('./routes/ruleRoutes');
const auditRoutes = require('./routes/auditRoutes');
const mockRoutes = require('./routes/mockRoutes');
const externalAPIRoutes = require('./routes/externalAPIRoutes');
const monitoringRoutes = require('./routes/monitoringRoutes');

// Import services
const archiveService = require('./services/archiveService');
const errorMonitoringService = require('./services/errorMonitoringService');

// Import tracking middleware
const { trackingMiddleware } = require('./middleware/trackingMiddleware');

// Initialize Express app
const app = express();

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'glitchguard-api' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Connect to MongoDB using Mongoose
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/glitchguard';

mongoose.connect(MONGODB_URI, {
  // Mongoose 6+ doesn't need these options, but keeping for compatibility
})
  .then(() => {
    logger.info('✅ Connected to MongoDB');
  })
  .catch((error) => {
    logger.error('❌ MongoDB connection error:', error);
    // For demo purposes, continue even if MongoDB fails (will use mock data)
    logger.warn('⚠️  Continuing in mock mode (MongoDB not available)');
  });

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply tracking middleware (IP and session tracking)
app.use(trackingMiddleware.getMiddleware());

// Configure Morgan for HTTP request logging
const morganFormat = process.env.NODE_ENV === 'production' 
  ? 'combined' 
  : 'dev';

app.use(morgan(morganFormat, {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Root API endpoint - provides API information
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'GlitchGuard Error Management API',
    version: '1.0.0',
    endpoints: {
      logs: {
        'GET /api/logs': 'Get error logs with optional filters (severity, service, errorType, date range, pagination)',
        'POST /api/logs': 'Create a new error log',
        'GET /api/logs/stats': 'Get aggregated error statistics'
      },
      rules: {
        'GET /api/rules': 'Get all retention rules',
        'POST /api/rules': 'Create a new retention rule',
        'PUT /api/rules/:id': 'Update a retention rule',
        'DELETE /api/rules/:id': 'Delete a retention rule',
        'PATCH /api/rules/:id/archive-toggle': 'Toggle auto-archival for a rule'
      },
      audit: {
        'GET /api/audit': 'Get audit logs with filters (IP, session, endpoint, method)',
        'GET /api/audit/stats': 'Get audit statistics',
        'GET /api/audit/ip/:ip': 'Get stats for a specific IP address',
        'GET /api/audit/session/:sessionId': 'Get logs for a specific session'
      },
      external: {
        'GET /api/external/services': 'List all monitored external services',
        'GET /api/external/errors': 'Get errors from all external services',
        'GET /api/external/:serviceName/errors': 'Get errors from specific service',
        'POST /api/external/:serviceName/report': 'Report error from external service',
        'GET /api/external/stats': 'Get error statistics from external services'
      },
      monitoring: {
        'GET /api/monitoring/status': 'Get monitoring service status',
        'POST /api/monitoring/start': 'Start automatic error monitoring',
        'POST /api/monitoring/stop': 'Stop automatic error monitoring',
        'POST /api/monitoring/trigger': 'Manually trigger monitoring cycle'
      },
      mock: {
        'POST /api/mock/generate': 'Generate random mock errors (count, includeRepeated)',
        'GET /api/mock/examples': 'Get example error templates'
      },
      health: {
        'GET /health': 'Server health check'
      }
    },
    documentation: 'See README.md for detailed API documentation'
  });
});

// API Routes
app.use('/api/logs', logRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/external', externalAPIRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/mock', mockRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Schedule auto-archival job (runs on configured schedule)
const archiveCronSchedule = process.env.ARCHIVE_CRON_SCHEDULE
  || (process.env.NODE_ENV === 'development' ? '*/1 * * * *' : '0 2 * * *');

cron.schedule(archiveCronSchedule, async () => {
  logger.info('⏰ Running scheduled auto-archival job...');
  const result = await archiveService.archiveLogsByRules();
  if (result.success) {
    logger.info(`✅ Scheduled archival completed: ${result.logsArchived} logs archived`);
  } else {
    logger.error('❌ Scheduled archival failed:', result.error);
  }
}, {
  scheduled: true,
  timezone: process.env.TIMEZONE || "America/New_York"
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`🚀 GlitchGuard Server running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`📝 API Base: http://localhost:${PORT}/api`);
  
  // Start error monitoring service (if enabled)
  if (process.env.ENABLE_AUTO_MONITORING !== 'false') {
    logger.info('🔄 Starting automatic error monitoring...');
    errorMonitoringService.startMonitoring();
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server...');
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
