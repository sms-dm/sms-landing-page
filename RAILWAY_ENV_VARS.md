# Railway Environment Variables Required

## Database
- `POSTGRESQL_URL` - Automatically provided by Railway PostgreSQL plugin

## Security
- `JWT_SECRET` - Generate a secure random string (e.g., `openssl rand -base64 32`)

## Per Service Variables

### Onboarding Backend (port 3006)
```
NODE_ENV=production
DATABASE_URL=${{POSTGRESQL_URL}}
JWT_SECRET=${{JWT_SECRET}}
JWT_REFRESH_SECRET=${{JWT_SECRET}}_refresh
PORT=3006
CORS_ORIGIN=https://${{services.onboarding-frontend.RAILWAY_PUBLIC_DOMAIN}}
FRONTEND_URL=https://${{services.onboarding-frontend.RAILWAY_PUBLIC_DOMAIN}}
DEMO_MODE=false
ACCESS_TOKEN_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d
BCRYPT_ROUNDS=10
```

### Onboarding Frontend (port 4173)
```
NODE_ENV=production
VITE_API_BASE_URL=https://${{services.onboarding-backend.RAILWAY_PUBLIC_DOMAIN}}
```

### Maintenance Backend (port 5001)
```
NODE_ENV=production
DATABASE_URL=${{POSTGRESQL_URL}}
JWT_SECRET=${{JWT_SECRET}}
PORT=5001
CORS_ORIGIN=https://${{services.maintenance-frontend.RAILWAY_PUBLIC_DOMAIN}}
```

### Maintenance Frontend (port 4173)
```
NODE_ENV=production
VITE_API_URL=https://${{services.maintenance-backend.RAILWAY_PUBLIC_DOMAIN}}/api
```

### Landing Page (port 3002)
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

## Optional Variables (if needed)

### Email Configuration
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=SMS <noreply@yourdomain.com>
```

### AWS S3 (for file uploads)
```
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### Redis (if caching needed)
```
REDIS_URL=${{REDIS_URL}}
```

## Notes
1. Railway automatically provides `RAILWAY_PUBLIC_DOMAIN` for each service
2. Use Railway's reference syntax `${{variable}}` for cross-service URLs
3. Generate strong secrets for production use
4. Enable PostgreSQL and Redis plugins in Railway dashboard if needed