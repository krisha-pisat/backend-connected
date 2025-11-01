# Environment Variables Setup Guide

Follow these steps to complete your `.env` file configuration:

## Step-by-Step Configuration

### 1. Server Configuration (Required)

**PORT**
- Default: `5000`
- Change if: Port 5000 is already in use
- Example: `PORT=3001`

**NODE_ENV**
- Options: `development` or `production`
- Default: `development`
- Keep as `development` for local testing

### 2. MongoDB Configuration (Required)

**MONGODB_URI**

**Option A: Local MongoDB (Recommended for Demo)**
```env
MONGODB_URI=mongodb://localhost:27017/glitchguard
```
- Requires: MongoDB installed locally on your machine
- Download: https://www.mongodb.com/try/download/community

**Option B: MongoDB Atlas (Cloud - Free Tier Available)**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/glitchguard
```
- Steps:
  1. Go to https://www.mongodb.com/cloud/atlas
  2. Sign up for free account
  3. Create a free cluster
  4. Create a database user (username/password)
  5. Get connection string from "Connect" button
  6. Replace `username:password` with your credentials
  7. Replace `cluster.mongodb.net` with your cluster URL

**Option C: Use Default (For Testing Without MongoDB)**
```env
MONGODB_URI=mongodb://localhost:27017/glitchguard
```
- Note: Server will continue in mock mode if MongoDB isn't available

### 3. Client Configuration (Optional)

**CLIENT_URL**
- Default: `http://localhost:3000`
- Change if: Your React app runs on a different port
- For production: Set to your deployed frontend URL

### 4. Logging Configuration (Optional)

**LOG_LEVEL**
- Options: `error`, `warn`, `info`, `debug`
- Default: `info`
- Recommendation: Keep as `info` for development

### 5. Email Configuration (For Demo - Mock Mode by Default)

**ALERT_EMAIL**
- Default: `admin@example.com`
- Change to: Your email address for receiving alerts
- Example: `ALERT_EMAIL=yourname@example.com`

**For Real Email (Optional - Uncomment when ready)**
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
```
- Note: Currently using mock email service
- To enable real emails:
  1. Install nodemailer: `npm install nodemailer`
  2. Uncomment email code in `services/emailService.js`
  3. For Gmail: Use App Password (not regular password)
  4. Enable 2FA and generate app password

### 6. Timezone Configuration (Optional)

**TIMEZONE**
- Default: `America/New_York`
- Change to: Your preferred timezone
- Examples:
  - `TIMEZONE=UTC`
  - `TIMEZONE=Asia/Kolkata`
  - `TIMEZONE=Europe/London`
- List: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

## Quick Setup for Demo

Minimum required configuration for testing:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/glitchguard
CLIENT_URL=http://localhost:3000
ALERT_EMAIL=your-email@example.com
```

Everything else can use defaults!

## Verifying Your Configuration

After editing `.env`, you can verify it works by:

1. **Start the server:**
   ```powershell
   npm start
   ```

2. **Check health endpoint:**
   Open browser: `http://localhost:5000/health`

3. **Expected output:**
   ```json
   {
     "status": "ok",
     "timestamp": "2024-...",
     "mongodb": "connected" or "disconnected"
   }
   ```

## Troubleshooting

**MongoDB Connection Issues:**
- If MongoDB isn't installed: Server will continue in mock mode
- To install MongoDB locally: https://www.mongodb.com/try/download/community
- Or use MongoDB Atlas (free cloud option)

**Port Already in Use:**
- Change `PORT=5000` to another port (e.g., `PORT=5001`)
- Update any frontend API URLs accordingly

**Email Not Working:**
- This is expected - mock email service is active
- Check console logs for "📧 EMAIL ALERT (Mock):" messages
- Real email requires additional setup (see Email Configuration above)
