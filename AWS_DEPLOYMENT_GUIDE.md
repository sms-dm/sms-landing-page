# AWS Deployment Guide for SMS

## Quick Start Deployment Plan

Based on our previous decisions, here's the step-by-step AWS deployment:

### Phase 1: Today's Deployment (MVP on Single EC2)

#### 1. Domain Setup
- Domain: smartmaintenancesystems.com
- Register if not already done
- Point to AWS Route 53

#### 2. Single EC2 Instance Setup
```bash
# Launch EC2 instance
- Type: t3.large (4GB RAM, 2 vCPU)
- OS: Ubuntu 22.04 LTS
- Storage: 100GB SSD
- Security Group: Open 80, 443, 22
```

#### 3. Quick Deployment Script
```bash
#!/bin/bash
# deploy-mvp.sh

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx postgresql postgresql-contrib certbot python3-certbot-nginx git

# Clone repository
git clone https://github.com/[your-repo]/SMS.git /opt/sms

# Install PM2
sudo npm install -g pm2

# Setup PostgreSQL
sudo -u postgres psql << EOF
CREATE USER smsuser WITH PASSWORD 'secure_password_here';
CREATE DATABASE sms_maintenance;
CREATE DATABASE sms_onboarding;
GRANT ALL PRIVILEGES ON DATABASE sms_maintenance TO smsuser;
GRANT ALL PRIVILEGES ON DATABASE sms_onboarding TO smsuser;
EOF

# Setup applications
cd /opt/sms

# Maintenance Portal
cd sms-app/backend
npm install
npm run build
cd ../frontend
npm install
npm run build

# Onboarding Portal  
cd ../../SMS-Onboarding-Unified/backend
npm install
npm run build
cd ../frontend
npm install
npm run build

# Landing Page
cd ../../sms-landing
npm install
npm run build

# Setup Nginx
sudo tee /etc/nginx/sites-available/sms << EOF
server {
    listen 80;
    server_name smartmaintenancesystems.com www.smartmaintenancesystems.com;
    
    location / {
        root /opt/sms/sms-landing/dist;
        try_files \$uri \$uri/ /index.html;
    }
}

server {
    listen 80;
    server_name app.smartmaintenancesystems.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:3005;
    }
}

server {
    listen 80;
    server_name onboard.smartmaintenancesystems.com;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/sms /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Setup SSL
sudo certbot --nginx -d smartmaintenancesystems.com -d www.smartmaintenancesystems.com -d app.smartmaintenancesystems.com -d onboard.smartmaintenancesystems.com

# Create PM2 ecosystem file
tee /opt/sms/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'maintenance-backend',
      cwd: '/opt/sms/sms-app/backend',
      script: 'dist/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
        DATABASE_URL: 'postgresql://smsuser:secure_password_here@localhost:5432/sms_maintenance',
        JWT_SECRET: '$(openssl rand -hex 32)',
        BRIDGE_SECRET: '$(openssl rand -hex 32)'
      }
    },
    {
      name: 'maintenance-frontend',
      cwd: '/opt/sms/sms-app/frontend',
      script: 'serve',
      args: '-s build -l 3000',
      interpreter: 'none'
    },
    {
      name: 'onboarding-backend',
      cwd: '/opt/sms/SMS-Onboarding-Unified/backend',
      script: 'dist/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        DATABASE_URL: 'postgresql://smsuser:secure_password_here@localhost:5432/sms_onboarding',
        JWT_SECRET: '$(openssl rand -hex 32)',
        BRIDGE_SECRET: '$(openssl rand -hex 32)'
      }
    },
    {
      name: 'onboarding-frontend',
      cwd: '/opt/sms/SMS-Onboarding-Unified/frontend',
      script: 'serve',
      args: '-s dist -l 3002',
      interpreter: 'none'
    }
  ]
};
EOF

# Install serve
sudo npm install -g serve

# Start all applications
cd /opt/sms
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Phase 2: AWS SES Email Setup

```bash
# Configure AWS CLI
aws configure

# Verify domain in SES
aws ses verify-domain-identity --domain smartmaintenancesystems.com

# Create email addresses
aws ses verify-email-identity --email-address notifications@smartmaintenancesystems.com
aws ses verify-email-identity --email-address support@smartmaintenancesystems.com
aws ses verify-email-identity --email-address alerts@smartmaintenancesystems.com
```

### Phase 3: Environment Variables

Create `/opt/sms/.env.production`:
```env
# Application
NODE_ENV=production
APP_URL=https://smartmaintenancesystems.com

# Database
DATABASE_URL=postgresql://smsuser:secure_password_here@localhost:5432/sms_maintenance

# Authentication
JWT_SECRET=your-generated-secret
JWT_REFRESH_SECRET=your-generated-refresh-secret
BRIDGE_SECRET=shared-bridge-secret

# AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
EMAIL_FROM=notifications@smartmaintenancesystems.com

# Hidden Markup (NEVER EXPOSE)
PARTS_MARKUP_PERCENTAGE=20
```

### Testing Checklist

1. **Landing Page**
   - [ ] https://smartmaintenancesystems.com loads
   - [ ] SSL certificate valid
   - [ ] All animations work
   - [ ] Links to portals work

2. **Onboarding Portal**
   - [ ] https://onboard.smartmaintenancesystems.com loads
   - [ ] Can create new company
   - [ ] Can add users
   - [ ] Can create vessel
   - [ ] Can add equipment

3. **Maintenance Portal**
   - [ ] https://app.smartmaintenancesystems.com loads
   - [ ] Can login with demo credentials
   - [ ] Can import data from onboarding
   - [ ] Can create work orders
   - [ ] Parts ordering shows correct price (with hidden markup)

4. **Email System**
   - [ ] Welcome email sends
   - [ ] Password reset works
   - [ ] Fault notifications work

5. **Integration**
   - [ ] Auth bridge works between portals
   - [ ] Data export/import works
   - [ ] Single sign-on works

### Quick Commands

```bash
# Check services
pm2 status

# View logs
pm2 logs maintenance-backend
pm2 logs onboarding-backend

# Restart services
pm2 restart all

# Update deployment
cd /opt/sms
git pull
pm2 restart all
```

### Next Steps After MVP

1. Move to RDS for database
2. Setup S3 for file storage
3. Implement CloudFront CDN
4. Add auto-scaling
5. Setup monitoring with CloudWatch

## Estimated Time: 2-3 hours for complete MVP deployment

Ready to start deployment!