# How to Use GlitchGuard - Quick Guide

## Understanding "Mock API"

**What is "Mock"?**
- The **Email Service** is "mock" - it logs to console instead of sending real emails
- The **Backend API** is REAL and working - it connects to MongoDB and stores data
- When you see "📧 EMAIL ALERT (Mock)" in server console, that's the mock email service working

**Where is the Mock API?**
- Location: `server/services/emailService.js`
- It simulates email sending (logs to console)
- In production, you'd uncomment the real email code and configure it

## How to See the UI

### Step 1: Start the Backend Server

```powershell
cd server
npm start
```

You should see:
- ✅ Server running on port 5000
- ✅ MongoDB connection status

### Step 2: Start the Frontend Client

**Open a NEW terminal window** (keep the server running):

```powershell
cd client
npm start
```

The React app will:
- Open automatically at `http://localhost:3000`
- Show the GlitchGuard Error Dashboard
- Connect to your backend API at `http://localhost:5000`

## Verifying Everything Works

### ✅ Backend is Working If:
1. Visit `http://localhost:5000/health` → Shows server status
2. Visit `http://localhost:5000/api` → Shows API endpoints
3. Server console shows Winston/Morgan logs

### ✅ Frontend is Working If:
1. Dashboard loads at `http://localhost:3000`
2. You see "Error Statistics" section (may be empty initially)
3. You can click "+ Log New Error" button

### ✅ Mock Email is Working If:
1. Log a **critical** error → Check server console for "📧 EMAIL ALERT (Mock)"
2. Log the same error twice (within an hour) → Should trigger email alert
3. Look in server terminal for email notifications

## Quick Test Steps

1. **Start both servers** (backend on port 5000, frontend on port 3000)

2. **Open the dashboard**: `http://localhost:3000`

3. **Log a test error**:
   - Click "+ Log New Error"
   - Use quick fill example (e.g., "critical - payment-service")
   - Or fill manually
   - Click "Log Error"

4. **Verify it worked**:
   - Error should appear in the list
   - Statistics should update
   - If critical severity → Check server console for email alert

5. **Filter errors**:
   - Use filters (Severity, Service, Error Type)
   - See results update in real-time

## Troubleshooting

**No UI showing?**
- Make sure frontend is running: `cd client && npm start`
- Check browser console for errors
- Verify backend is running on port 5000

**Can't connect to API?**
- Check backend is running: `http://localhost:5000/health`
- Check CORS settings in `server.js`
- Verify `CLIENT_URL` in `.env` matches frontend URL

**No errors showing?**
- This is normal if you haven't logged errors yet
- Click "+ Log New Error" to create one
- Or run `npm run seed` in server folder to populate sample data

**Email alerts not showing?**
- Check server console (not browser)
- Look for "📧 EMAIL ALERT (Mock)" messages
- Critical errors trigger immediately
- Repeated errors (same error 2+ times) trigger after second occurrence

## Where to Look

- **Backend Logs**: Server terminal where you ran `npm start`
- **Frontend UI**: Browser at `http://localhost:3000`
- **API Testing**: Use `http://localhost:5000/api` or the `test-api.http` file
- **Database**: Check MongoDB if you want to see stored data

## Next Steps

1. ✅ Start both servers
2. ✅ Open the dashboard
3. ✅ Log some test errors
4. ✅ Watch email alerts in server console
5. ✅ Filter and view errors in the UI

Enjoy your Error Management System! 🎉
