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

// 7. Start Server
app.listen(PORT, () => console.log(`EAMS Server listening on port ${PORT}`));