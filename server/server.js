// EAMS Backend server.js (Running on Port 5001)

require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
// --- CORRECTED PATHS START HERE ---

// 1. Database connection
const mongoose = require('mongoose');

// 2. Routes
const logRoutes = require('./routes/logRoutes');
const ruleRoutes = require('./routes/ruleRoutes');
const auditRoutes = require('./routes/auditRoutes');
const monitoringRoutes = require('./routes/monitoringRoutes');
const mockRoutes = require('./routes/mockRoutes');
const externalAPIRoutes = require('./routes/externalAPIRoutes');

// 3. Model imports (Required for Mongoose to register schemas)
const ErrorLog = require('./models/ErrorLog');
const RetentionRule = require('./models/RetentionRule');
const AuditLog = require('./models/AuditLog');

// --- CORRECTED PATHS END HERE ---

const app = express();
const PORT = process.env.PORT || 5001; 

// 1. Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/error-management';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });

// 2. CORS Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',      
        'http://127.0.0.1:3000',
        'http://localhost:5174',      
        'http://127.0.0.1:5174',
        'http://localhost:5000',      
        'http://127.0.0.1:5000'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true
}));

// 3. Body Parser Middleware
app.use(express.json());

// 3.5. Enable Tracking Middleware for Audit Logging (optional - logs EAMS API calls)
const { trackingMiddleware } = require('./middleware/trackingMiddleware');
app.use(trackingMiddleware.getMiddleware());

// 4. Routes
app.use('/api/logs', logRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/mock', mockRoutes);
app.use('/api/external', externalAPIRoutes);

// 5. Unhandled Route Fallback
app.use((req, res, next) => {
    const err = new Error(`The requested resource ${req.originalUrl} was not found on this server.`);
    err.statusCode = 404;
    next(err); 
});

// 6. Global Error Handler (assuming this is present)
// ... app.use(async (err, req, res, next) => { ... } )

// 7. Set up Auto-Archival Cron Job
const archiveService = require('./services/archiveService');
const cron = require('node-cron');

// Archive cron schedule - runs every minute by default (configurable via env)
// Format: minute hour day month weekday
// '*/1 * * * *' = every minute
// '0 */1 * * *' = every hour
// '0 0 * * *' = every day at midnight
const ARCHIVE_CRON_SCHEDULE = process.env.ARCHIVE_CRON_SCHEDULE || '*/1 * * * *'; // Every minute

// Start the cron job for auto-archival
cron.schedule(ARCHIVE_CRON_SCHEDULE, async () => {
  try {
    console.log('⏰ Running scheduled auto-archival job...');
    const result = await archiveService.archiveLogsByRules();
    if (result.success) {
      console.log(`✅ Scheduled archival completed: ${result.logsArchived} logs archived`);
    } else {
      console.error(`❌ Scheduled archival failed: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Error in scheduled archival job:', error);
  }
});

console.log(`📅 Auto-archival cron job scheduled: ${ARCHIVE_CRON_SCHEDULE}`);

// 8. Start Server
app.listen(PORT, () => {
  console.log(`EAMS Server listening on port ${PORT}`);
  console.log(`[EAMS] Error logs endpoint: http://localhost:${PORT}/api/logs`);
  console.log(`[EAMS] Audit logs endpoint: http://localhost:${PORT}/api/audit`);
  console.log(`[EAMS] Ready to receive error logs and audit logs from external services`);
  console.log(`[EAMS] Audit logging enabled for EAMS API calls`);
  console.log(`[EAMS] Auto-archival cron job: Running every minute`);
  if (process.env.GROQ_API_KEY) {
    console.log(`[EAMS] 🤖 AI Explanation service: Enabled (Groq API)`);
  } else {
    console.log(`[EAMS] ⚠️  AI Explanation service: Disabled (GROQ_API_KEY not set)`);
  }
});