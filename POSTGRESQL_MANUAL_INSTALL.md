# PostgreSQL Manual Installation Guide

Since we need sudo access, please run these commands manually:

## 1. Install PostgreSQL

```bash
# Update package list
sudo apt update

# Install PostgreSQL and additional components
sudo apt install -y postgresql postgresql-contrib

# Check installation
psql --version
```

## 2. Set up PostgreSQL User and Databases

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE USER sms_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE sms_maintenance OWNER sms_user;
CREATE DATABASE sms_onboarding OWNER sms_user;
GRANT ALL PRIVILEGES ON DATABASE sms_maintenance TO sms_user;
GRANT ALL PRIVILEGES ON DATABASE sms_onboarding TO sms_user;
\q
```

## 3. Configure PostgreSQL Authentication

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Add these lines (before the existing "local" lines):
local   sms_maintenance    sms_user                     md5
local   sms_onboarding     sms_user                     md5
host    sms_maintenance    sms_user    127.0.0.1/32     md5
host    sms_onboarding     sms_user    127.0.0.1/32     md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## 4. Create .env Files

For Maintenance Portal (`/home/sms/repos/SMS/sms-app/.env`):
```
DATABASE_URL=postgresql://sms_user:your_secure_password_here@localhost:5432/sms_maintenance
```

For Onboarding Portal (`/home/sms/repos/SMS/SMS-Onboarding-Unified/.env`):
```
DATABASE_URL=postgresql://sms_user:your_secure_password_here@localhost:5432/sms_onboarding
```

## 5. Test Connections

```bash
# Test maintenance database
psql -U sms_user -d sms_maintenance -h localhost

# Test onboarding database  
psql -U sms_user -d sms_onboarding -h localhost
```

## 6. Next Steps

After PostgreSQL is installed:
1. Run the migration scripts in `/home/sms/repos/SMS/database-migrations/`
2. Update the application code to use PostgreSQL
3. Test all functionality

## Alternative: Use Docker

If you prefer Docker:
```bash
docker run --name sms-postgres \
  -e POSTGRES_USER=sms_user \
  -e POSTGRES_PASSWORD=your_secure_password_here \
  -e POSTGRES_DB=sms_maintenance \
  -p 5432:5432 \
  -d postgres:15

# Create second database
docker exec -it sms-postgres psql -U sms_user -c "CREATE DATABASE sms_onboarding;"
```