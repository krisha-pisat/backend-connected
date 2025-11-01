# Modular Tracking Middleware - Usage Guide

The tracking middleware is designed to be **reusable across different projects**. It tracks IP addresses, user sessions, and API calls automatically.

## Installation in a New Project

1. **Copy the middleware files:**
   ```
   server/
   ├── middleware/
   │   └── trackingMiddleware.js
   ├── models/
   │   └── AuditLog.js
   ```

2. **Install dependencies:**
   ```bash
   npm install mongoose uuid express
   ```

3. **Configure MongoDB connection** (if not already set up)

## Basic Usage

### Step 1: Import and Initialize

```javascript
const express = require('express');
const { TrackingMiddleware } = require('./middleware/trackingMiddleware');

const app = express();

// Initialize with your project settings
const tracking = new TrackingMiddleware({
  projectId: 'my-project-name',  // Unique identifier for this project
  enableAuditLogging: true,      // Set to false to disable audit logging
  excludedPaths: ['/health', '/favicon.ico'], // Paths to exclude from tracking
  getUserId: (req) => req.user?.id || null    // Custom function to get user ID
});

// Apply middleware (BEFORE other routes)
app.use(tracking.getMiddleware());
```

### Step 2: Access Tracking Info in Routes

The middleware automatically attaches tracking information to requests:

```javascript
app.post('/api/data', (req, res) => {
  // Access tracking info
  const { ipAddress, sessionId, userId } = req.trackingInfo;
  
  // Or access directly
  const ip = req.clientIP;
  const session = req.sessionId;
  
  // Your route logic...
  res.json({ 
    message: 'Success',
    tracked: { ipAddress, sessionId, userId }
  });
});
```

### Step 3: Query Audit Logs

```javascript
const AuditLog = require('./models/AuditLog');

// Get logs for a specific IP
const ipLogs = await AuditLog.find({ ipAddress: '192.168.1.1' })
  .sort({ createdAt: -1 })
  .limit(100);

// Get stats for an IP
const stats = await AuditLog.getStatsByIP('192.168.1.1', 24); // Last 24 hours

// Get logs for a session
const sessionLogs = await AuditLog.find({ sessionId: 'session-id' });
```

## Configuration Options

### TrackingMiddleware Options

```javascript
const tracking = new TrackingMiddleware({
  // Required: Unique project identifier
  projectId: 'my-project',
  
  // Optional: Enable/disable audit logging (default: true)
  enableAuditLogging: true,
  
  // Optional: Paths to exclude from tracking
  excludedPaths: ['/health', '/status', '/metrics'],
  
  // Optional: Custom function to extract user ID from request
  getUserId: (req) => {
    // Your custom logic
    return req.user?.id || req.headers['x-user-id'] || null;
  }
});
```

## Environment Variables

Add to your `.env` file:

```env
# Project identifier
PROJECT_ID=my-project-name

# Enable/disable audit logging
ENABLE_AUDIT_LOGGING=true

# MongoDB connection (required)
MONGODB_URI=mongodb://localhost:27017/mydb
```

## Features

### ✅ Automatic IP Tracking
- Extracts IP from `x-forwarded-for`, `x-real-ip`, or connection
- Works behind proxies and load balancers

### ✅ Session Management
- Automatically generates UUID-based session IDs
- Supports existing session IDs from cookies/headers
- Can integrate with express-session

### ✅ API Audit Logging
- Logs all API calls (method, endpoint, status, response time)
- Tracks request/response data (sanitized)
- Doesn't block requests (async logging)

### ✅ Security
- Automatically sanitizes sensitive data (passwords, tokens, etc.)
- Redacts sensitive headers (authorization, cookies)

## Integration Examples

### With Express Session

```javascript
const session = require('express-session');

app.use(session({
  secret: 'your-secret',
  resave: false,
  saveUninitialized: false
}));

// Custom getUserId to use session
const tracking = new TrackingMiddleware({
  projectId: 'my-project',
  getUserId: (req) => req.session.userId || null
});

app.use(tracking.getMiddleware());
```

### With JWT Authentication

```javascript
const jwt = require('jsonwebtoken');

const tracking = new TrackingMiddleware({
  projectId: 'my-project',
  getUserId: (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.userId;
      } catch (e) {
        return null;
      }
    }
    return null;
  }
});
```

### Minimal Setup (Just IP & Session)

```javascript
const tracking = new TrackingMiddleware({
  projectId: 'simple-project',
  enableAuditLogging: false  // Disable audit logging
});

app.use(tracking.captureRequestInfo()); // Only IP and session
```

## Querying Audit Data

### Common Queries

```javascript
const AuditLog = require('./models/AuditLog');

// Most active IPs
const topIPs = await AuditLog.aggregate([
  {
    $group: {
      _id: '$ipAddress',
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } },
  { $limit: 10 }
]);

// Slowest endpoints
const slowEndpoints = await AuditLog.aggregate([
  {
    $group: {
      _id: '$endpoint',
      avgResponseTime: { $avg: '$responseTime' }
    }
  },
  { $sort: { avgResponseTime: -1 } },
  { $limit: 10 }
]);

// Errors by IP
const errorsByIP = await AuditLog.find({
  statusCode: { $gte: 400 }
}).distinct('ipAddress');
```

## Performance Considerations

- **Async Logging**: Audit logs are saved asynchronously, so they don't slow down requests
- **Indexes**: AuditLog model includes indexes for common queries (IP, session, endpoint, timestamp)
- **Excluded Paths**: Exclude health checks and static files to reduce noise

## Troubleshooting

**Audit logs not appearing?**
- Check `ENABLE_AUDIT_LOGGING` is set to `true`
- Verify MongoDB connection
- Check excluded paths aren't too broad

**Session IDs not persisting?**
- The middleware generates new sessions if none exists
- Use express-session for persistent sessions
- Check if cookies are being sent/received

**IP showing as 'unknown'?**
- Check if behind a proxy (use `trust proxy` in Express)
- Verify `x-forwarded-for` header is present
- Check `req.connection.remoteAddress` is accessible

## Example: Complete Setup

```javascript
// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { TrackingMiddleware } = require('./middleware/trackingMiddleware');

const app = express();

// Connect MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Apply tracking
const tracking = new TrackingMiddleware({
  projectId: process.env.PROJECT_ID || 'default',
  enableAuditLogging: true
});
app.use(tracking.getMiddleware());

// Your routes
app.get('/api/data', (req, res) => {
  res.json({
    data: 'example',
    tracked: req.trackingInfo
  });
});

app.listen(3000);
```

That's it! Your API calls are now automatically tracked with IP and session information.
