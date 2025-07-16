#!/bin/bash

# SMS Onboarding Portal - Start All Services

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SMS Onboarding Portal - Starting All  ${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo -e "${RED}Error: Must run this script from the project root directory${NC}"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}Error: Port $1 is already in use${NC}"
        echo -e "${YELLOW}Please stop the service using port $1 or change the port in configuration${NC}"
        return 1
    fi
    return 0
}

# Check required ports
echo -e "${GREEN}Checking port availability...${NC}"
check_port 3000 || exit 1
check_port 5173 || exit 1
check_port 5432 || echo -e "${YELLOW}Warning: PostgreSQL port 5432 not available. Make sure PostgreSQL is running.${NC}"

# Make scripts executable
chmod +x start-backend.sh start-frontend.sh stop-all.sh

# Start backend in background
echo -e "${GREEN}Starting Backend Service...${NC}"
gnome-terminal --title="SMS Backend" -- bash -c "./start-backend.sh; exec bash" 2>/dev/null || \
xterm -title "SMS Backend" -e "./start-backend.sh" 2>/dev/null || \
(./start-backend.sh &)

# Wait for backend to start
echo -e "${YELLOW}Waiting for backend to start...${NC}"
sleep 5

# Check if backend is running
if curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}Backend is running!${NC}"
else
    echo -e "${YELLOW}Backend health check failed, but continuing...${NC}"
fi

# Start frontend in background
echo -e "${GREEN}Starting Frontend Service...${NC}"
gnome-terminal --title="SMS Frontend" -- bash -c "./start-frontend.sh; exec bash" 2>/dev/null || \
xterm -title "SMS Frontend" -e "./start-frontend.sh" 2>/dev/null || \
(./start-frontend.sh &)

# Display status
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Services are starting up!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Access the application at:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "  Backend API: ${GREEN}http://localhost:3000/api${NC}"
echo -e "  Health Check: ${GREEN}http://localhost:3000/health${NC}"
echo ""
echo -e "${BLUE}Default Demo Credentials:${NC}"
echo -e "  Admin: ${YELLOW}admin@demo.com / Demo123!${NC}"
echo -e "  Manager: ${YELLOW}manager@demo.com / Demo123!${NC}"
echo -e "  Technician: ${YELLOW}tech@demo.com / Demo123!${NC}"
echo -e "  HSE Officer: ${YELLOW}hse@demo.com / Demo123!${NC}"
echo ""
echo -e "${YELLOW}To stop all services, run: ./stop-all.sh${NC}"
echo ""
echo -e "${GREEN}Happy coding!${NC}"