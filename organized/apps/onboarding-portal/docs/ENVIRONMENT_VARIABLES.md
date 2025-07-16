# Environment Variables Documentation

This document describes all environment variables used by the SMS Onboarding Portal.

## Quick Start

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the values according to your environment

## Backend Environment Variables

### Core Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode: `development`, `production`, or `test` |
| `PORT` | No | `3000` | Port number for the backend server |

### Database Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string. Format: `postgresql://user:password@host:port/database` |

### Redis Configuration (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection string for caching and sessions |

### Authentication

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | - | Secret key for signing JWT tokens. **Must be changed in production** |
| `JWT_REFRESH_SECRET` | Yes | - | Secret key for signing refresh tokens. **Must be changed in production** |
| `ACCESS_TOKEN_EXPIRES_IN` | No | `7d` | Access token expiration time (e.g., `15m`, `1h`, `7d`) |
| `REFRESH_TOKEN_EXPIRES_IN` | No | `30d` | Refresh token expiration time |
| `BCRYPT_ROUNDS` | No | `10` | Number of bcrypt rounds for password hashing |

### CORS Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origins (comma-separated for multiple) |

### Email Configuration (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_HOST` | No | `smtp.gmail.com` | SMTP server host |
| `EMAIL_PORT` | No | `587` | SMTP server port |
| `EMAIL_SECURE` | No | `false` | Use TLS/SSL for email |
| `EMAIL_USER` | No | - | SMTP username |
| `EMAIL_PASS` | No | - | SMTP password |
| `EMAIL_FROM` | No | `SMS Onboarding <noreply@sms-onboarding.com>` | Default sender email |

### AWS S3 Configuration (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AWS_ACCESS_KEY_ID` | No | - | AWS access key for S3 uploads |
| `AWS_SECRET_ACCESS_KEY` | No | - | AWS secret key for S3 uploads |
| `AWS_REGION` | No | `us-east-1` | AWS region |
| `AWS_S3_BUCKET` | No | `sms-onboarding-uploads` | S3 bucket name for file uploads |

### Demo Mode

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DEMO_MODE` | No | `true` | Enable demo mode with pre-configured users |

### Other Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FRONTEND_URL` | No | `http://localhost:5173` | Frontend URL for password reset links |
| `MAX_FILE_SIZE` | No | `10485760` | Maximum file upload size in bytes (default: 10MB) |

## Frontend Environment Variables

Create a `frontend/.env` file:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | `http://localhost:3000/api` | Backend API URL |
| `VITE_WS_URL` | Yes | `ws://localhost:3000` | WebSocket URL |
| `VITE_APP_NAME` | No | `SMS Onboarding Portal` | Application name |
| `VITE_ENABLE_OFFLINE` | No | `true` | Enable offline mode features |

## Production Configuration

For production deployment, ensure you:

1. Set `NODE_ENV=production`
2. Use strong, unique values for `JWT_SECRET` and `JWT_REFRESH_SECRET`
3. Configure a production PostgreSQL database
4. Set appropriate CORS origins
5. Configure email settings for password resets
6. Set up AWS S3 for file uploads (optional)
7. Disable `DEMO_MODE`

## Example Production `.env`

```env
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://sms_user:strong_password@db.example.com:5432/sms_onboarding

# Redis
REDIS_URL=redis://redis.example.com:6379

# Authentication
JWT_SECRET=your-very-long-random-string-here
JWT_REFRESH_SECRET=another-very-long-random-string-here
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGIN=https://sms.example.com

# Email
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=SMS Onboarding <noreply@example.com>

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=sms-onboarding-production

# Demo Mode
DEMO_MODE=false

# Frontend URL
FRONTEND_URL=https://sms.example.com
```

## Security Notes

- Never commit `.env` files to version control
- Always use strong, unique secrets in production
- Rotate secrets regularly
- Use environment-specific configuration files
- Store sensitive values in a secure secrets management system