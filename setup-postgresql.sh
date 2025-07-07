#!/bin/bash

# PostgreSQL Setup Script for SMS Project
# This script installs PostgreSQL, creates databases and users for SMS

echo "=== PostgreSQL Setup for SMS Project ==="
echo

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Step 1: Install PostgreSQL
echo "Step 1: Installing PostgreSQL..."
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Check if installation was successful
if command -v psql &> /dev/null; then
    print_success "PostgreSQL installed successfully"
    psql --version
else
    print_error "PostgreSQL installation failed"
    exit 1
fi

# Step 2: Start and enable PostgreSQL service
echo
echo "Step 2: Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

if sudo systemctl is-active --quiet postgresql; then
    print_success "PostgreSQL service is running"
else
    print_error "Failed to start PostgreSQL service"
    exit 1
fi

# Step 3: Create databases and user
echo
echo "Step 3: Creating databases and user..."

# Generate a secure password
DB_PASSWORD=$(openssl rand -base64 12)

# Create user and databases
sudo -u postgres psql << EOF
-- Create user
CREATE USER sms_user WITH PASSWORD '$DB_PASSWORD';

-- Create maintenance database
CREATE DATABASE sms_maintenance OWNER sms_user;

-- Create onboarding database
CREATE DATABASE sms_onboarding OWNER sms_user;

-- Grant all privileges on databases to sms_user
GRANT ALL PRIVILEGES ON DATABASE sms_maintenance TO sms_user;
GRANT ALL PRIVILEGES ON DATABASE sms_onboarding TO sms_user;

-- Show created databases
\l
EOF

# Step 4: Configure PostgreSQL for local connections
echo
echo "Step 4: Configuring PostgreSQL authentication..."

# Find PostgreSQL version and config directory
PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP '\d+(?=\.)')
PG_CONFIG_DIR="/etc/postgresql/$PG_VERSION/main"

# Backup original pg_hba.conf
sudo cp $PG_CONFIG_DIR/pg_hba.conf $PG_CONFIG_DIR/pg_hba.conf.backup

# Add authentication rule for sms_user (if not already present)
if ! sudo grep -q "local.*sms_user" $PG_CONFIG_DIR/pg_hba.conf; then
    echo "# SMS project databases" | sudo tee -a $PG_CONFIG_DIR/pg_hba.conf
    echo "local   sms_maintenance    sms_user                                md5" | sudo tee -a $PG_CONFIG_DIR/pg_hba.conf
    echo "local   sms_onboarding     sms_user                                md5" | sudo tee -a $PG_CONFIG_DIR/pg_hba.conf
    echo "host    sms_maintenance    sms_user        127.0.0.1/32            md5" | sudo tee -a $PG_CONFIG_DIR/pg_hba.conf
    echo "host    sms_onboarding     sms_user        127.0.0.1/32            md5" | sudo tee -a $PG_CONFIG_DIR/pg_hba.conf
fi

# Reload PostgreSQL to apply changes
sudo systemctl reload postgresql

# Step 5: Test connections
echo
echo "Step 5: Testing database connections..."

# Test maintenance database connection
if PGPASSWORD=$DB_PASSWORD psql -U sms_user -d sms_maintenance -h localhost -c "SELECT 'Maintenance DB connection successful' as status;" 2>/dev/null | grep -q "Maintenance DB connection successful"; then
    print_success "Successfully connected to sms_maintenance database"
else
    print_error "Failed to connect to sms_maintenance database"
fi

# Test onboarding database connection
if PGPASSWORD=$DB_PASSWORD psql -U sms_user -d sms_onboarding -h localhost -c "SELECT 'Onboarding DB connection successful' as status;" 2>/dev/null | grep -q "Onboarding DB connection successful"; then
    print_success "Successfully connected to sms_onboarding database"
else
    print_error "Failed to connect to sms_onboarding database"
fi

# Step 6: Create credentials file
echo
echo "Step 6: Saving credentials..."

cat > /home/sms/repos/SMS/database-credentials.txt << EOL
=== SMS PostgreSQL Database Credentials ===
Generated: $(date)

Database User: sms_user
Database Password: $DB_PASSWORD

Maintenance Portal Database:
- Database Name: sms_maintenance
- Connection String: postgresql://sms_user:$DB_PASSWORD@localhost:5432/sms_maintenance

Onboarding Portal Database:
- Database Name: sms_onboarding
- Connection String: postgresql://sms_user:$DB_PASSWORD@localhost:5432/sms_onboarding

Environment Variables:
export SMS_MAINTENANCE_DB_URL="postgresql://sms_user:$DB_PASSWORD@localhost:5432/sms_maintenance"
export SMS_ONBOARDING_DB_URL="postgresql://sms_user:$DB_PASSWORD@localhost:5432/sms_onboarding"

Node.js Connection Example:
const { Pool } = require('pg');
const maintenancePool = new Pool({
  connectionString: process.env.SMS_MAINTENANCE_DB_URL,
});

IMPORTANT: Keep these credentials secure!
EOL

chmod 600 /home/sms/repos/SMS/database-credentials.txt
print_success "Credentials saved to database-credentials.txt (read-only for owner)"

# Step 7: Create .env files for both portals
echo
echo "Step 7: Creating .env files for portals..."

# Create .env for maintenance portal
cat > /home/sms/repos/SMS/sms-app/.env << EOL
# Database Configuration
DATABASE_URL=postgresql://sms_user:$DB_PASSWORD@localhost:5432/sms_maintenance
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sms_maintenance
DB_USER=sms_user
DB_PASSWORD=$DB_PASSWORD

# Other existing configurations can be added here
EOL

# Create .env for onboarding portal
cat > /home/sms/repos/SMS/SMS-Onboarding-Unified/.env << EOL
# Database Configuration
DATABASE_URL=postgresql://sms_user:$DB_PASSWORD@localhost:5432/sms_onboarding
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sms_onboarding
DB_USER=sms_user
DB_PASSWORD=$DB_PASSWORD

# Other existing configurations can be added here
EOL

print_success "Created .env files for both portals"

# Final summary
echo
echo "======================================="
echo "PostgreSQL Setup Complete!"
echo "======================================="
echo
print_success "PostgreSQL $(psql --version | grep -oP '\d+\.\d+') installed and running"
print_success "Databases created: sms_maintenance, sms_onboarding"
print_success "User created: sms_user"
print_success "Credentials saved to: database-credentials.txt"
print_success "Environment files created for both portals"
echo
print_warning "IMPORTANT: Keep database-credentials.txt secure!"
print_warning "You may want to add .env files to .gitignore"
echo
echo "To connect to databases manually:"
echo "  psql -U sms_user -d sms_maintenance -h localhost"
echo "  psql -U sms_user -d sms_onboarding -h localhost"
echo
echo "To set environment variables in your shell:"
echo "  source <(grep export /home/sms/repos/SMS/database-credentials.txt)"