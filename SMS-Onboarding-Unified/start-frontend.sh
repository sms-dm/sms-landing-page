#!/bin/bash

# SMS Onboarding Portal - Frontend Start Script

echo "Starting SMS Onboarding Frontend..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run this script from the project root directory${NC}"
    exit 1
fi

# Check for frontend environment file
if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}Creating frontend .env file...${NC}"
    cat > frontend/.env << EOF
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
VITE_APP_NAME=SMS Onboarding Portal
VITE_ENABLE_OFFLINE=true
EOF
    echo -e "${GREEN}Created frontend/.env file${NC}"
fi

# Check if node_modules exists in root
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install dependencies${NC}"
        exit 1
    fi
fi

# Generate icons if needed
if [ ! -f "public/images/sms-icon-192.png" ]; then
    echo -e "${GREEN}Generating PWA icons...${NC}"
    node scripts/generate-icons.js
fi

# Start the frontend development server
echo -e "${GREEN}Starting frontend server on port 5173...${NC}"
npm run dev