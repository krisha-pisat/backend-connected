# GlitchGuard - Error Management System

A comprehensive error logging and management system built with Node.js, Express, MongoDB, React, Winston, and Morgan.

## Features

- 🔍 **Centralized Error Logging**: Log errors from browser, server, and database
- 📊 **Dashboard-Ready Queries**: Aggregated statistics and filtering
- 📧 **Email Alerts**: Automatic email notifications for critical or repeated errors
- 🗄️ **Auto-Archival**: Automated log archival based on retention rules
- 📝 **Morgan & Winston Logging**: HTTP request logging with Morgan, application logging with Winston
- 🎯 **Retention Rules**: Configurable rules for log retention and archival

## Project Structure

```
NEURATHON-GlitchGuard/
├── server/
│   ├── models/
│   │   ├── ErrorLog.js          # Error log data model
│   │   └── RetentionRule.js     # Retention rule data model
│   ├── routes/
│   │   ├── logRoutes.js         # Error log API routes
│   │   └── ruleRoutes.js        # Retention rule API routes
│   ├── services/
│   │   ├── emailService.js      # Email notification service
│   │   └── archiveService.js    # Auto-archival service
│   ├── utils/
│   │   └── mockData.js          # Mock data for testing
│   ├── logs/                    # Winston log files (auto-created)
│   ├── server.js                # Main server file
│   ├── package.json
│   ├── .env.example
│   └── test-api.http            # API test requests
└── client/
    └── (React frontend - to be implemented)
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Server Setup

1. **Navigate to server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/glitchguard
   CLIENT_URL=http://localhost:3000
   ALERT_EMAIL=admin@example.com
   ENABLE_AUTO_MONITORING=true     # Start monitoring service automatically
   POLL_INTERVAL_MS=30000          # Monitoring interval in milliseconds (30s default)
   ARCHIVE_CRON_SCHEDULE=*/1 * * * *  # Archival cron schedule (every minute by default in dev)
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

   The server will start on `http://localhost:5000`

### Client Setup (Optional - for frontend)

1. **Navigate to client directory**:
   ```bash
   cd client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the client**:
   ```bash
   npm start
   ```

   The client will start on `http://localhost:3000`

## API Endpoints

### Error Logs

- **GET** `/api/logs` - Get error logs with optional filters
  - Query params: `severity`, `service`, `errorType`, `startDate`, `endDate`, `isArchived`, `page`, `limit`
  
- **POST** `/api/logs` - Create a new error log
  - Body: `severity`, `service`, `errorType`, `message`, `stackTrace`, `url`, `userAgent`, `userId`, `metadata`

- **GET** `/api/logs/stats` - Get aggregated error statistics
  - Returns: Total count, breakdown by severity, service, and error type

### Retention Rules

- **GET** `/api/rules` - Get all retention rules
  
- **POST** `/api/rules` - Create a new retention rule
  - Body: `name`, `description`, `conditions`, `retentionDuration`, `retentionUnit` (`minutes` | `hours` | `days`), `autoArchive`
  
- **PUT** `/api/rules/:id` - Update a retention rule
  
- **DELETE** `/api/rules/:id` - Delete a retention rule
  
- **PATCH** `/api/rules/:id/archive-toggle` - Toggle auto-archival for a rule

### External Services & Monitoring

- **GET** `/api/external/services` - List all simulated external services
- **GET** `/api/external/errors` - Get errors from all external services
- **GET** `/api/external/:service/errors` - Get errors from a specific service
- **POST** `/api/external/:service/report` - Simulate an external service reporting an error
- **GET** `/api/external/stats` - Get error statistics for external services

### Monitoring Controls

- **GET** `/api/monitoring/status` - Get monitoring service status
- **POST** `/api/monitoring/start` - Start automatic monitoring (polling external APIs)
- **POST** `/api/monitoring/stop` - Stop automatic monitoring
- **POST** `/api/monitoring/trigger` - Manually trigger a monitoring cycle

### Health Check

- **GET** `/health` - Server health status

## Testing the API

Use the provided `test-api.http` file with REST Client extension in VS Code, or use Postman/Insomnia.

Example request:
```http
POST http://localhost:5000/api/logs
Content-Type: application/json

{
  "severity": "critical",
  "service": "payment-service",
  "errorType": "server",
  "message": "Payment gateway timeout",
  "stackTrace": "Error: Request timeout...",
  "url": "/api/payments/process"
}
```

## Email Alerts

Email alerts are automatically triggered for:
1. **Critical severity errors** - Immediately
2. **Repeated errors** - When the same error occurs multiple times within an hour (high/medium severity)

Currently using **mock email service** for demo. To enable real emails:
1. Uncomment email code in `server/services/emailService.js`
2. Install nodemailer: `npm install nodemailer`
3. Configure email credentials in `.env`

## Auto-Archival

The system includes a cron job that runs daily at 2 AM (configurable) to automatically archive logs based on retention rules. In development mode, it also runs hourly for testing.

## Logging

- **Morgan**: Logs all HTTP requests to console
- **Winston**: Application logs saved to:
  - `logs/combined.log` - All logs
  - `logs/error.log` - Error logs only

## Error Severity Levels

- `low` - Minor issues, informational
- `medium` - Moderate issues that may affect functionality
- `high` - Significant issues requiring attention
- `critical` - Urgent issues requiring immediate action

## Error Types

- `browser` - Client-side errors from frontend
- `server` - Backend server errors
- `database` - Database connection/query errors

## License

ISC

## Contributing

This is a demo project for NEURATHON. Feel free to extend and modify as needed.
