# Railway Deployment URL Guide

## Finding Your Public URLs in Railway Dashboard

### 1. Where to Find Public URLs

1. **Login to Railway Dashboard**
   - Go to https://railway.app
   - Sign in to your account

2. **Navigate to Your Project**
   - Click on your SMS project from the dashboard
   - You'll see all your deployed services

3. **Locate Services with Public URLs**
   - Look for services with a 🌐 globe icon or "Public URL" label
   - Only frontend services have public URLs
   - Backend services (APIs) are internal only

### 2. Services with Public URLs

Your SMS project has **TWO frontend services** with public URLs:

1. **sms-app (Maintenance Portal)**
   - Service name: `sms-app` or `maintenance-portal`
   - This is your main maintenance management application

2. **SMS-Onboarding-Unified (Onboarding Portal)**
   - Service name: `sms-onboarding` or `onboarding-portal`
   - This is your customer onboarding application

### 3. How to Identify Which URL is Which

#### In Railway Dashboard:
- Click on each service card
- Look for the **"Settings"** tab
- Under **"Networking"** section, you'll see:
  - **Public Networking** → Your app's public URL
  - Example: `https://sms-app-production.up.railway.app`

#### Visual Identification:
- **sms-app**: Look for the service running on port 3000
- **sms-onboarding**: Look for the service running on port 5173
- Services named `backend`, `api`, or similar do NOT have public URLs

### 4. What You Should See at Each URL

#### Maintenance Portal (sms-app)
**URL Pattern**: `https://[your-service-name]-production.up.railway.app`

When you visit, you should see:
- Login page with SMS branding
- Fields for email and password
- "Smart Marine Systems" header
- Professional blue/marine themed interface

**Test Credentials**:
- Email: `admin@sms.com`
- Password: `admin123`

#### Onboarding Portal (SMS-Onboarding-Unified)
**URL Pattern**: `https://[your-service-name]-production.up.railway.app`

When you visit, you should see:
- Welcome page for new customers
- "Get Started" or "Begin Onboarding" button
- Clean, modern interface
- Step-by-step onboarding flow

### 5. Troubleshooting

**If you can't find the URLs:**
1. Make sure the services are deployed (green status)
2. Check that "Generate Domain" is enabled in service settings
3. Wait 2-3 minutes after deployment for URLs to activate

**If the apps don't load:**
1. Check Railway logs for each service
2. Ensure environment variables are set correctly
3. Verify the build completed successfully

### 6. Quick Reference

| Service | Purpose | Default Port | Has Public URL |
|---------|---------|--------------|----------------|
| sms-app | Maintenance Portal | 3000 | ✅ Yes |
| sms-onboarding | Onboarding Portal | 5173 | ✅ Yes |
| backend/api | API Server | 5000 | ❌ No (Internal) |
| postgres | Database | 5432 | ❌ No (Internal) |

### Pro Tips
- Bookmark your production URLs for easy access
- Railway URLs are permanent unless you delete/recreate services
- You can set custom domains later through Railway settings
- Both frontends communicate with the backend API internally