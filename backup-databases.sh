#!/bin/bash

# Database Backup Script for SMS Project
# This script creates backups of both SMS databases

# Configuration
BACKUP_DIR="$HOME/sms-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7  # Keep backups for 7 days

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Helper functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

echo "=== SMS Database Backup Script ==="
echo "Backup Time: $(date)"
echo

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    print_success "Created backup directory: $BACKUP_DIR"
fi

# Read database credentials
if [ ! -f "database-credentials.txt" ]; then
    print_error "database-credentials.txt not found. Run setup-postgresql.sh first."
    exit 1
fi

# Extract connection details
DB_USER="sms_user"
DB_PASSWORD=$(grep "Database Password:" database-credentials.txt | cut -d' ' -f3)

if [ -z "$DB_PASSWORD" ]; then
    print_error "Could not read database password from credentials file."
    exit 1
fi

# Export password for pg_dump
export PGPASSWORD=$DB_PASSWORD

# Function to backup a database
backup_database() {
    local db_name=$1
    local backup_file="$BACKUP_DIR/${db_name}_${TIMESTAMP}.sql"
    
    echo "Backing up $db_name database..."
    
    if pg_dump -U $DB_USER -h localhost $db_name > "$backup_file" 2>/dev/null; then
        # Compress the backup
        gzip "$backup_file"
        local compressed_file="${backup_file}.gz"
        local size=$(du -h "$compressed_file" | cut -f1)
        print_success "Backed up $db_name to $(basename "$compressed_file") (Size: $size)"
        return 0
    else
        print_error "Failed to backup $db_name database"
        rm -f "$backup_file"  # Remove empty file
        return 1
    fi
}

# Backup both databases
backup_maintenance=0
backup_onboarding=0

if backup_database "sms_maintenance"; then
    backup_maintenance=1
fi

if backup_database "sms_onboarding"; then
    backup_onboarding=1
fi

# Clean up old backups
echo
echo "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
print_success "Old backups cleaned up"

# Create backup summary
SUMMARY_FILE="$BACKUP_DIR/backup_summary.txt"
{
    echo "=== SMS Database Backup Summary ==="
    echo "Generated: $(date)"
    echo
    echo "Latest Backups:"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5
    echo
    echo "Backup Status:"
    [ $backup_maintenance -eq 1 ] && echo "✓ sms_maintenance: Success" || echo "✗ sms_maintenance: Failed"
    [ $backup_onboarding -eq 1 ] && echo "✓ sms_onboarding: Success" || echo "✗ sms_onboarding: Failed"
    echo
    echo "Total Backup Size: $(du -sh "$BACKUP_DIR" | cut -f1)"
    echo "Number of Backups: $(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l)"
} > "$SUMMARY_FILE"

# Display summary
echo
cat "$SUMMARY_FILE"

# Unset password
unset PGPASSWORD

# Exit with appropriate code
if [ $backup_maintenance -eq 1 ] && [ $backup_onboarding -eq 1 ]; then
    exit 0
else
    exit 1
fi