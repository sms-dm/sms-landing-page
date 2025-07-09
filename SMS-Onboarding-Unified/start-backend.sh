#!/bin/bash

# SMS Onboarding Portal - Backend Start Script

echo "Starting SMS Onboarding Backend..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [ ! -f "backend/package.json" ]; then
    echo -e "${RED}Error: Must run this script from the project root directory${NC}"
    exit 1
fi

# Check for required environment files
if [ ! -f ".env" ] && [ ! -f ".env.development" ]; then
    echo -e "${YELLOW}Warning: No .env file found. Creating from .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}Created .env file from .env.example${NC}"
        echo -e "${YELLOW}Please update the .env file with your actual configuration${NC}"
    else
        echo -e "${RED}Error: No .env.example file found${NC}"
        exit 1
    fi
fi

# Navigate to backend directory
cd backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install dependencies${NC}"
        exit 1
    fi
fi

# Generate Prisma client
echo -e "${GREEN}Generating Prisma client...${NC}"
npm run db:generate:dev

# Check database connection
echo -e "${GREEN}Checking database connection...${NC}"
node ../scripts/test-db-connection.js
if [ $? -ne 0 ]; then
    echo -e "${RED}Database connection failed. Please check your DATABASE_URL in .env${NC}"
    echo -e "${YELLOW}Make sure PostgreSQL is running and accessible${NC}"
    exit 1
fi

# Run database migrations
echo -e "${GREEN}Running database migrations...${NC}"
npm run db:push:dev
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to run database migrations${NC}"
    exit 1
fi

# Start the backend server
echo -e "${GREEN}Starting backend server on port 3000...${NC}"
npm run dev