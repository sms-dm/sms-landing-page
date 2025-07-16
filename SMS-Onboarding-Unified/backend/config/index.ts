// Application configuration
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  APP_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '7d',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  },
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/sms_onboarding',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true,
  },
  
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    from: process.env.EMAIL_FROM || 'SMS Onboarding <noreply@sms-onboarding.com>',
  },
  
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || 'sms-onboarding-uploads',
  },
  
  demo: {
    enabled: process.env.DEMO_MODE === 'true',
    users: [
      {
        email: 'admin@demo.com',
        password: 'Demo123!',
        fullName: 'Demo Admin',
        role: 'ADMIN',
      },
      {
        email: 'manager@demo.com',
        password: 'Demo123!',
        fullName: 'Demo Manager',
        role: 'MANAGER',
      },
      {
        email: 'tech@demo.com',
        password: 'Demo123!',
        fullName: 'Demo Technician',
        role: 'TECHNICIAN',
      },
      {
        email: 'hse@demo.com',
        password: 'Demo123!',
        fullName: 'Demo HSE Officer',
        role: 'HSE_OFFICER',
      },
    ],
  },
  
  security: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
    allowedFileTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ],
  },
  
  integration: {
    webhookSecret: process.env.WEBHOOK_SECRET || 'your-webhook-secret-change-in-production',
    maintenanceApiUrl: process.env.MAINTENANCE_API_URL || 'http://localhost:3001',
    maintenanceApiKey: process.env.MAINTENANCE_API_KEY || 'your-maintenance-api-key',
  },
};