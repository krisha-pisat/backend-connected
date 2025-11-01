# Fix 404 Errors for Audit and Mock Routes

## Problem
Getting 404 errors for:
- `/api/audit`
- `/api/audit/stats`
- `/api/mock/generate`

And 500 errors for:
- `/api/logs`

## Solution

### Step 1: Restart Your Server

**The server MUST be restarted** to load the new routes. 

1. **Stop the current server:**
   - Go to the terminal where the server is running
   - Press `Ctrl+C` to stop it

2. **Navigate to server directory:**
   ```powershell
   cd server
   ```

3. **Install uuid package (if not already installed):**
   ```powershell
   npm install uuid
   ```

4. **Restart the server:**
   ```powershell
   npm start
   ```

### Step 2: Verify Routes are Loaded

After restarting, you should see in the server console:
```
🚀 GlitchGuard Server running on port 5000
✅ Connected to MongoDB
```

Test the routes:
- Visit: `http://localhost:5000/api` (should show all endpoints)
- Visit: `http://localhost:5000/api/audit` (should return empty array or logs)
- Visit: `http://localhost:5000/health` (should show server status)

### Step 3: Fix 500 Errors on /api/logs

If you're getting 500 errors on `/api/logs`, it might be because:

1. **MongoDB connection issue** - Check server console for connection errors
2. **Schema mismatch** - If you had existing data, the new fields might cause issues

**Quick fix:** Clear old error logs (optional):
```powershell
# In MongoDB shell or using a script
# Or just restart MongoDB
```

## Common Issues

### "Cannot find module 'uuid'"
```powershell
cd server
npm install uuid
```

### Routes still return 404
- Make sure server is fully restarted (not just reloaded)
- Check server console for any import errors
- Verify files exist:
  - `server/routes/auditRoutes.js`
  - `server/routes/mockRoutes.js`
  - `server/middleware/trackingMiddleware.js`

### MongoDB connection errors
- Check `.env` file has correct `MONGODB_URI`
- Make sure MongoDB is running
- Server will continue in "mock mode" if MongoDB isn't available (but routes still won't work)

## Verification Checklist

- [ ] Server restarted (stopped and started again)
- [ ] UUID package installed (`npm list uuid`)
- [ ] MongoDB connected (check server console)
- [ ] `/api` endpoint works (shows endpoint list)
- [ ] `/api/audit` returns JSON (even if empty)
- [ ] `/api/mock/generate` can be called (POST request)
- [ ] Frontend can connect to backend

## Still Having Issues?

Check the server console output for specific error messages. Common errors:

1. **"Cannot find module"** → Run `npm install`
2. **"Mongoose connection error"** → Check MongoDB is running
3. **"Route not found"** → Server not restarted
4. **500 Internal Server Error** → Check server console for detailed error

The server console will show exactly what's wrong!
