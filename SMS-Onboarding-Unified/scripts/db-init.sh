#!/bin/bash

# Database initialization script
# This script sets up the database for both development and production environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Parse command line arguments
ENV=${1:-development}

print_message $YELLOW "Initializing database for $ENV environment..."

# Change to backend directory
cd "$(dirname "$0")/../backend"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_message $YELLOW "Installing dependencies..."
    npm install
fi

# Generate Prisma client
if [ "$ENV" = "development" ]; then
    print_message $YELLOW "Generating Prisma client for development..."
    npm run db:generate:dev
    
    print_message $YELLOW "Running migrations for SQLite..."
    npm run db:push:dev
    
    print_message $YELLOW "Seeding database..."
    npm run db:seed
    
    print_message $GREEN "Development database initialized successfully!"
    print_message $YELLOW "You can now run 'npm run db:studio:dev' to open Prisma Studio"
    
elif [ "$ENV" = "production" ]; then
    print_message $YELLOW "Generating Prisma client for production..."
    npm run db:generate:prod
    
    print_message $YELLOW "Running migrations for PostgreSQL..."
    npm run db:migrate:prod
    
    print_message $GREEN "Production database initialized successfully!"
    print_message $YELLOW "Remember to run seed manually if needed: npm run db:seed"
    
else
    print_message $RED "Invalid environment: $ENV"
    print_message $YELLOW "Usage: ./db-init.sh [development|production]"
    exit 1
fi