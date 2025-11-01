# GlitchGuard Project Architecture

## Overview

GlitchGuard is a comprehensive error management system that monitors **all APIs and console errors**, displays them on the Error Management page, and tracks all API interactions in Audit Logs.

## Architecture Flow

```
┌─────────────────────────────────────────────────────────┐
│                  Error Sources                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. Browser Console Errors                               │
│     ↓ (Auto-captured)                                    │
│                                                           │
│  2. External Mock API Services                            │
│     - payment-service                                    │
│     - user-service                                       │
│     - notification-service                               │
│     - auth-service                                       │
│     - analytics-service                                  │
│     ↓ (Monitored by Error Monitoring Service)            │
│                                                           │
│  3. Manual Error Logging                                 │
│     ↓ (Via Error Log Form)                               │
│                                                           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│            Error Management System                        │
│                                                           │
│  • Captures IP & Session                                 │
│  • Stores in MongoDB                                     │
│  • Triggers Email Alerts                                 │
│  • Auto-archives based on rules                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│              Display & Monitoring                         │
│                                                           │
│  Error Management Page:                                  │
│  • View all errors from all sources                      │
│  • Filter by severity, service, type                     │
│  • See IP, session, source (external/console/manual)     │
│                                                           │
│  Audit Log Page:                                         │
│  • All API calls tracked                                │
│  • IP and session monitoring                             │
│  • Response times and status codes                       │
└─────────────────────────────────────────────────────────┘
```

## Components

### 1. Mock External API Service (`mockExternalAPIService.js`)

**Purpose:** Simulates external services that send errors

**Features:**
- Multiple services: payment, user, notification, auth, analytics
- Returns errors as if from real external APIs
- Configurable error rates per service
- RESTful API endpoints

**Endpoints:**
- `GET /api/external/services` - List all services
- `GET /api/external/errors` - Get errors from all services
- `GET /api/external/:serviceName/errors` - Get errors from specific service
- `POST /api/external/:serviceName/report` - Report error
- `GET /api/external/stats` - Service statistics

### 2. Error Monitoring Service (`errorMonitoringService.js`)

**Purpose:** Monitors external APIs and automatically logs errors

**Features:**
- Automatic polling of external APIs (every 30 seconds)
- Fetches errors from mock external API
- Logs errors to error management system
- Triggers email alerts
- Prevents duplicate logging

**Operations:**
- Start/stop monitoring
- Manual trigger
- Monitor specific services
- Status reporting

### 3. Console Error Capture (`errorCapture.js` - Frontend)

**Purpose:** Automatically captures browser/console errors

**Features:**
- Captures `window.error` events
- Captures unhandled promise rejections
- Captures `console.error` calls
- Sends errors to error management system
- Adds session tracking

### 4. Tracking Middleware (`trackingMiddleware.js`)

**Purpose:** Tracks IP addresses and sessions for all API calls

**Features:**
- Automatic IP extraction
- Session ID generation/management
- Audit logging of all API calls
- Works across different projects (modular)

### 5. Retention Rules Management

**Components:**
- Retention rules API (`/api/rules`)
- Retention rules dashboard (new UI tab)
- Rule creation form with severity/service/type filters
- UI actions: enable/disable auto archive, activate/deactivate, delete

### 6. Audit Log System

**Components:**
- Audit logging API (`/api/audit`)
- Audit dashboard (Audit Log page)
- IP and session tracking
- API call statistics

## Data Flow

### Error from External API:
```
1. External Mock API generates error
   ↓
2. Error Monitoring Service polls API
   ↓
3. Fetches error data
   ↓
4. Logs to ErrorLog collection (with IP/session)
   ↓
5. Appears on Error Management page
   ↓
6. Email alert if critical/repeated
```

### Error from Browser Console:
```
1. Browser throws error
   ↓
2. ErrorCapture service catches it
   ↓
3. Sends to /api/logs endpoint
   ↓
4. Stored in ErrorLog collection
   ↓
5. Appears on Error Management page
```

### API Call Tracking:
```
1. Any API request to server
   ↓
2. Tracking middleware captures IP/session
   ↓
3. Logs to AuditLog collection
   ↓
4. Appears on Audit Log page
```

## File Structure

```
server/
├── services/
│   ├── mockExternalAPIService.js    # Simulates external services
│   ├── errorMonitoringService.js   # Monitors & logs errors
│   ├── emailService.js              # Email notifications
│   └── archiveService.js            # Auto-archival
├── routes/
│   ├── logRoutes.js                 # Error logging endpoints
│   ├── auditRoutes.js               # Audit log endpoints
│   ├── externalAPIRoutes.js        # External API simulation
│   └── monitoringRoutes.js         # Monitoring control
├── middleware/
│   └── trackingMiddleware.js        # IP & session tracking
└── models/
    ├── ErrorLog.js                  # Error log schema
    └── AuditLog.js                  # Audit log schema

client/
├── services/
│   ├── api.js                       # API client
│   └── errorCapture.js              # Console error capture
└── components/
    ├── ErrorDashboard.js            # Error management UI
    ├── AuditDashboard.js             # Audit log UI
    └── MonitoringControls.js        # Monitoring controls
```

## How It Works for Demo

### Step 1: Start Server
- Server starts on port 5000
- Error monitoring service auto-starts
- Polls external APIs every 30 seconds

### Step 2: External APIs Generate Errors
- Mock external API services have errors available
- Monitoring service fetches them
- Errors are logged to your system

### Step 3: Console Errors Captured
- Frontend automatically captures console errors
- Sends them to error management system
- Appears on Error Management page

### Step 4: View Errors
- **Error Management Page:** See all errors from all sources
- **Audit Log Page:** See all API calls with IP/session

## Key Features

✅ **Automatic Error Monitoring**
- Monitors external APIs automatically
- Captures browser console errors
- All errors appear in one place

✅ **External API Simulation**
- Mock services act like real external APIs
- RESTful endpoints
- Realistic error scenarios

✅ **Complete Tracking**
- IP addresses captured
- Session IDs tracked
- All API calls audited

✅ **Unified Dashboard**
- All errors in Error Management page
- All API calls in Audit Log page
- Retention rules managed in dedicated UI
- Source identification (external/console/manual)

## Configuration

**Environment Variables:**
```env
ENABLE_AUTO_MONITORING=true        # Auto-start monitoring (default: true)
POLL_INTERVAL_MS=30000             # Monitoring interval (default: 30s)
ARCHIVE_CRON_SCHEDULE=*/1 * * * *  # Archival job schedule (default: every minute in dev)
```

## API Endpoints Summary

### Error Management
- `GET /api/logs` - View errors
- `POST /api/logs` - Log error manually

### External APIs (Mock)
- `GET /api/external/services` - List services
- `GET /api/external/errors` - Get errors
- `GET /api/external/:service/errors` - Service errors

### Monitoring
- `GET /api/monitoring/status` - Status
- `POST /api/monitoring/start` - Start
- `POST /api/monitoring/stop` - Stop
- `POST /api/monitoring/trigger` - Manual trigger

### Audit
- `GET /api/audit` - View audit logs
- `GET /api/audit/stats` - Statistics

---

**The system is now fully integrated:** External APIs → Monitoring → Error Management → Dashboard! 🎉
