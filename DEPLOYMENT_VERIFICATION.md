# SMS Deployment Verification Checklist

## 🚀 Services Status
All 5 services should be active on Railway:

1. **sms-landing** (Port 3002)
   - URL: Check Railway dashboard for public URL
   - Test: Visit the URL, should see landing page

2. **onboarding-frontend** (Port 4173)
   - URL: Check Railway dashboard for public URL
   - Test: Visit the URL, should see login page

3. **onboarding-backend** (Port 3006)
   - Health check: `[backend-url]/api/health`
   - Test: Should return {"status":"ok"} or similar

4. **maintenance-frontend** (Port 4173)
   - URL: Check Railway dashboard for public URL
   - Test: Visit the URL, should see login page

5. **maintenance-backend** (Port 5001)
   - Health check: `[backend-url]/api/health`
   - Test: Should return {"status":"ok"} or similar

## 🔍 Quick Tests

### 1. Frontend Loading
- Open each frontend URL
- Check browser console for errors (F12)
- Look for:
  - Failed API calls
  - CORS errors
  - Missing environment variables

### 2. API Connectivity
Test registration flow:
1. Go to Onboarding Frontend
2. Click "Register" or "Sign Up"
3. Try to create a test account
4. If it fails, check:
   - Network tab for API errors
   - Console for CORS issues

### 3. Database Connection
- If registration fails with 500 error, database might not be connected
- Check Railway logs for "Database connection failed" messages

## 🛠️ Common Issues & Fixes

### CORS Errors
If you see "CORS policy" errors:
- Backend needs proper CORS_ORIGIN env var
- Frontend needs correct API URL

### API Connection Failed
If frontend can't reach backend:
- Check VITE_API_BASE_URL in frontend env vars
- Ensure it uses https:// not http://

### Database Errors
If you see Prisma/database errors:
- Check if migrations ran (see Railway deploy logs)
- Verify POSTGRESQL_URL is set

## 📝 What to Check in Railway Dashboard

1. **Logs Tab** - Look for:
   - "Server started on port..."
   - "Database connected"
   - Any error messages

2. **Metrics Tab** - Shows:
   - Memory usage
   - CPU usage
   - Request count

3. **Settings Tab** - Verify:
   - Health check paths
   - Environment variables
   - Public networking enabled

## ✅ Success Indicators

- All services show "Active" status
- No error logs in past 5 minutes
- Can load all frontend pages
- Can register a new user account
- Health endpoints return 200 OK

## 🚨 Need Help?

If any service is failing:
1. Check the specific service logs in Railway
2. Look for error messages
3. Share the error details for troubleshooting