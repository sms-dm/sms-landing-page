#!/bin/bash

# SMS Onboarding Portal - Stop All Services

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SMS Onboarding Portal - Stopping All  ${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to kill process on port
kill_port() {
    local port=$1
    local service=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}Stopping $service on port $port...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null
        echo -e "${GREEN}$service stopped${NC}"
    else
        echo -e "${YELLOW}$service not running on port $port${NC}"
    fi
}

# Stop services
kill_port 3000 "Backend API"
kill_port 5173 "Frontend Dev Server"

# Kill any node processes related to the project
echo -e "${YELLOW}Cleaning up any remaining Node.js processes...${NC}"
pkill -f "node.*sms-onboarding" 2>/dev/null
pkill -f "vite" 2>/dev/null
pkill -f "nodemon" 2>/dev/null

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All services stopped successfully!${NC}"
echo -e "${GREEN}========================================${NC}"