# SMS Production Deployment Guide - Railway

## Overview
This guide walks you through deploying the Smart Marine Systems (SMS) platform to Railway, including all three portals and their backends.

## Pre-Deployment Checklist

- [x] Production code is in `master` branch
- [x] All services build successfully locally
- [ ] Domain name ready
- [ ] Railway account created
- [ ] Payment method added to Railway (for production use)

## Step 1: Install Railway CLI

```bash
curl -fsSL https://railway.app/install.sh | sh
```

## Step 2: Create Railway Project

1. Go to https://railway.app
2. Sign up/Login
3. Click "New Project"
4. Select "Empty Project"
5. Note your project ID

## Step 3: Set Up Services

In Railway dashboard, create the following services:

### 1. PostgreSQL Database
- Click "New" → "Database" → "PostgreSQL"
- Railway will automatically provision and provide DATABASE_URL

### 2. Landing Page Service
- Click "New" → "GitHub Repo" → Select your repo
- Set root directory: `/sms-landing`
- Set build command: `npm install && npm run build`
- Set start command: `npm start`
- Set PORT: `3002`

### 3. Onboarding Backend
- Click "New" → "GitHub Repo" → Select your repo  
- Set root directory: `/SMS-Onboarding-Unified/backend`
- Set build command: `npm install && npx prisma generate`
- Set start command: `npx prisma migrate deploy && npm start`
- Set PORT: `3006`

### 4. Onboarding Frontend
- Click "New" → "GitHub Repo" → Select your repo
- Set root directory: `/SMS-Onboarding-Unified`
- Set build command: `npm install && npm run build`
- Set start command: `npm run preview`
- Set PORT: `4173`

### 5. Maintenance Backend
- Click "New" → "GitHub Repo" → Select your repo
- Set root directory: `/sms-app/backend`
- Set build command: `npm install && npx prisma generate`
- Set start command: `npx prisma migrate deploy && npm start`
- Set PORT: `5001`

### 6. Maintenance Frontend
- Click "New" → "GitHub Repo" → Select your repo
- Set root directory: `/sms-app/frontend`
- Set build command: `npm install && npm run build`
- Set start command: `npm run preview`
- Set PORT: `4173`

## Step 4: Configure Environment Variables

For each service, add these environment variables in Railway:

### All Services
```
NODE_ENV=production
```

### Landing Page
```
NEXT_PUBLIC_ONBOARDING_URL=https://[onboarding-frontend-domain]
NEXT_PUBLIC_MAINTENANCE_URL=https://[maintenance-frontend-domain]
```

### Onboarding Backend
```
DATABASE_URL=[PostgreSQL DATABASE_URL from Railway]
JWT_SECRET=[generate a secure random string]
CORS_ORIGIN=https://[onboarding-frontend-domain]
```

### Onboarding Frontend
```
VITE_API_BASE_URL=https://[onboarding-backend-domain]
VITE_MAINTENANCE_URL=https://[maintenance-frontend-domain]
```

### Maintenance Backend
```
DATABASE_URL=[PostgreSQL DATABASE_URL from Railway]
JWT_SECRET=[same as onboarding backend]
CORS_ORIGIN=https://[maintenance-frontend-domain]
EMAIL_HOST=[your SMTP host]
EMAIL_PORT=587
EMAIL_USER=[your email]
EMAIL_PASS=[your email password]
```

### Maintenance Frontend
```
VITE_API_URL=https://[maintenance-backend-domain]/api
```

## Step 5: Set Up Custom Domains

1. In Railway, go to each service's Settings
2. Under "Domains", add your custom domain:
   - Landing: `yourdomain.com` or `www.yourdomain.com`
   - Onboarding: `onboard.yourdomain.com`
   - Maintenance: `app.yourdomain.com`
3. Update your DNS records with the provided CNAME values

## Step 6: Deploy

### Option 1: Via GitHub Integration
1. Push your code to GitHub
2. Railway will auto-deploy when you push to master

### Option 2: Via CLI
```bash
# Login to Railway
railway login

# Link to your project
railway link

# Deploy
railway up
```

## Step 7: Post-Deployment

1. **Test all services**:
   - Landing page: https://yourdomain.com
   - Onboarding: https://onboard.yourdomain.com
   - Maintenance: https://app.yourdomain.com

2. **Set up monitoring**:
   - Enable Railway's built-in metrics
   - Set up alerts for downtime

3. **Configure backups**:
   - Railway automatically backs up PostgreSQL
   - Consider setting up additional backup strategies

4. **Security hardening**:
   - Review all environment variables
   - Enable 2FA on Railway account
   - Set up proper CORS policies

## Troubleshooting

### Build Failures
- Check build logs in Railway dashboard
- Ensure all dependencies are in package.json
- Verify Node version compatibility

### Database Connection Issues
- Verify DATABASE_URL is set correctly
- Check if migrations have run
- Look for connection timeout settings

### CORS Errors
- Verify CORS_ORIGIN environment variables
- Check backend CORS middleware configuration

### Domain Issues
- Allow 24-48 hours for DNS propagation
- Verify CNAME records are correct
- Check SSL certificate status in Railway

## Rollback Procedure

If something goes wrong:
1. In Railway dashboard, go to Deployments
2. Find the last working deployment
3. Click "Rollback" 

## Support

- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app
- Your deployment logs: Available in Railway dashboard

## Important Notes

- Railway provides automatic SSL certificates
- Databases are automatically backed up daily
- You get $5 free credit monthly (covers development)
- Production usage requires a paid plan
- All services auto-scale based on traffic