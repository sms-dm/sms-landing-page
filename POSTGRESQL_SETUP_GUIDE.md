# PostgreSQL Setup Guide for SMS Project

## Overview
This guide documents the PostgreSQL setup process for the SMS (Smart Marine Systems) project, which requires two separate databases:
- `sms_maintenance` - For the Maintenance Portal
- `sms_onboarding` - For the Onboarding Portal

## Quick Setup

### Automated Setup (Recommended)
```bash
# Run the setup script
./setup-postgresql.sh

# Test the connections
npm install pg  # If not already installed
node test-database-connections.js
```

### Manual Setup

#### 1. Install PostgreSQL
```bash
# Update package list
sudo apt update

# Install PostgreSQL and additional contrib package
sudo apt install -y postgresql postgresql-contrib

# Verify installation
psql --version
```

#### 2. Start PostgreSQL Service
```bash
# Start the service
sudo systemctl start postgresql

# Enable auto-start on boot
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

#### 3. Create Databases and User
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run:
-- Create user (replace 'your_secure_password' with a strong password)
CREATE USER sms_user WITH PASSWORD 'your_secure_password';

-- Create databases
CREATE DATABASE sms_maintenance OWNER sms_user;
CREATE DATABASE sms_onboarding OWNER sms_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE sms_maintenance TO sms_user;
GRANT ALL PRIVILEGES ON DATABASE sms_onboarding TO sms_user;

-- Exit PostgreSQL
\q
```

#### 4. Configure Authentication
```bash
# Find your PostgreSQL version
psql --version

# Edit pg_hba.conf (adjust version number as needed)
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Add these lines:
local   sms_maintenance    sms_user                                md5
local   sms_onboarding     sms_user                                md5
host    sms_maintenance    sms_user        127.0.0.1/32            md5
host    sms_onboarding     sms_user        127.0.0.1/32            md5

# Reload PostgreSQL
sudo systemctl reload postgresql
```

## Connection Details

### Connection Strings
```
# Maintenance Portal
postgresql://sms_user:your_password@localhost:5432/sms_maintenance

# Onboarding Portal
postgresql://sms_user:your_password@localhost:5432/sms_onboarding
```

### Environment Variables
Add to your shell profile (~/.bashrc or ~/.zshrc):
```bash
export SMS_MAINTENANCE_DB_URL="postgresql://sms_user:your_password@localhost:5432/sms_maintenance"
export SMS_ONBOARDING_DB_URL="postgresql://sms_user:your_password@localhost:5432/sms_onboarding"
```

### Application Configuration

#### For Maintenance Portal (sms-app/.env):
```env
DATABASE_URL=postgresql://sms_user:your_password@localhost:5432/sms_maintenance
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sms_maintenance
DB_USER=sms_user
DB_PASSWORD=your_password
```

#### For Onboarding Portal (SMS-Onboarding-Unified/.env):
```env
DATABASE_URL=postgresql://sms_user:your_password@localhost:5432/sms_onboarding
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sms_onboarding
DB_USER=sms_user
DB_PASSWORD=your_password
```

## Testing Connections

### Using psql
```bash
# Test maintenance database
psql -U sms_user -d sms_maintenance -h localhost

# Test onboarding database
psql -U sms_user -d sms_onboarding -h localhost
```

### Using Node.js Test Script
```bash
node test-database-connections.js
```

### Using Node.js Code
```javascript
const { Pool } = require('pg');

// Maintenance database connection
const maintenancePool = new Pool({
  connectionString: process.env.SMS_MAINTENANCE_DB_URL,
});

// Onboarding database connection
const onboardingPool = new Pool({
  connectionString: process.env.SMS_ONBOARDING_DB_URL,
});

// Test query
async function testConnection(pool, dbName) {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log(`${dbName} connected:`, result.rows[0].now);
  } catch (err) {
    console.error(`${dbName} connection error:`, err);
  }
}

testConnection(maintenancePool, 'Maintenance');
testConnection(onboardingPool, 'Onboarding');
```

## Common Commands

### Database Management
```bash
# List all databases
sudo -u postgres psql -c "\l"

# List all users
sudo -u postgres psql -c "\du"

# Connect to a specific database
psql -U sms_user -d sms_maintenance -h localhost

# Backup a database
pg_dump -U sms_user -h localhost sms_maintenance > maintenance_backup.sql

# Restore a database
psql -U sms_user -h localhost sms_maintenance < maintenance_backup.sql
```

### Service Management
```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Stop PostgreSQL
sudo systemctl stop postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check status
sudo systemctl status postgresql

# View logs
sudo journalctl -u postgresql -f
```

## Troubleshooting

### Connection Refused
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check if PostgreSQL is listening on the correct port
sudo netstat -tlnp | grep 5432

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Authentication Failed
```bash
# Check pg_hba.conf configuration
sudo cat /etc/postgresql/*/main/pg_hba.conf

# Reload configuration
sudo systemctl reload postgresql

# Reset user password
sudo -u postgres psql -c "ALTER USER sms_user PASSWORD 'new_password';"
```

### Permission Denied
```bash
# Grant all privileges on database
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sms_maintenance TO sms_user;"

# Grant schema privileges (run inside the database)
GRANT ALL ON SCHEMA public TO sms_user;
```

## Security Best Practices

1. **Strong Passwords**: Use complex passwords with mix of letters, numbers, and symbols
2. **Connection Limits**: Configure max_connections in postgresql.conf
3. **SSL/TLS**: Enable SSL for production environments
4. **Firewall**: Restrict access to PostgreSQL port (5432)
5. **Regular Backups**: Set up automated backup scripts
6. **Monitoring**: Implement database monitoring and alerting

## Backup Strategy

### Manual Backup
```bash
# Create backup directory
mkdir -p ~/sms-backups

# Backup maintenance database
pg_dump -U sms_user -h localhost sms_maintenance > ~/sms-backups/maintenance_$(date +%Y%m%d_%H%M%S).sql

# Backup onboarding database
pg_dump -U sms_user -h localhost sms_onboarding > ~/sms-backups/onboarding_$(date +%Y%m%d_%H%M%S).sql
```

### Automated Backup Script
Create a cron job for regular backups:
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/sms/repos/SMS/backup-databases.sh
```

## Notes

- The setup script generates a secure random password for the database user
- Credentials are saved in `database-credentials.txt` with restricted permissions (600)
- Both `.env` files are created automatically with correct database URLs
- The test script verifies both read and write operations on each database
- Remember to add `.env` and `database-credentials.txt` to `.gitignore`