#!/bin/bash

# End-to-End Test Runner Script
# This script ensures the environment is properly set up before running tests

set -e

echo "🚀 SMS Onboarding End-to-End Test Runner"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000/api/v1}"
API_PORT="${API_PORT:-3000}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-30}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is open
port_is_open() {
    nc -z localhost "$1" >/dev/null 2>&1
}

# Function to wait for service
wait_for_service() {
    local name=$1
    local port=$2
    local timeout=$3
    local elapsed=0
    
    echo -n "Waiting for $name (port $port)..."
    
    while ! port_is_open "$port"; do
        if [ $elapsed -ge $timeout ]; then
            echo -e " ${RED}✗${NC} (timeout)"
            return 1
        fi
        
        echo -n "."
        sleep 1
        elapsed=$((elapsed + 1))
    done
    
    echo -e " ${GREEN}✓${NC}"
    return 0
}

# Pre-flight checks
echo "📋 Pre-flight Checks"
echo "-------------------"

# Check Node.js
if ! command_exists node; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js${NC} $NODE_VERSION"
fi

# Check npm
if ! command_exists npm; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
else
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm${NC} $NPM_VERSION"
fi

# Check if axios is installed
if ! npm list axios >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Installing axios...${NC}"
    npm install axios
fi

# Check PostgreSQL connection
echo -e "\n🗄️  Database Checks"
echo "-------------------"

if wait_for_service "PostgreSQL" "$DB_PORT" "$WAIT_TIMEOUT"; then
    echo -e "${GREEN}✓ PostgreSQL is accessible${NC}"
else
    echo -e "${RED}✗ PostgreSQL is not running on port $DB_PORT${NC}"
    echo "Please start PostgreSQL and try again"
    exit 1
fi

# Check API server
echo -e "\n🌐 API Server Checks"
echo "--------------------"

if wait_for_service "API Server" "$API_PORT" "$WAIT_TIMEOUT"; then
    # Double-check with health endpoint
    echo -n "Checking API health endpoint..."
    if curl -s -f "$API_URL/health" >/dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
    else
        echo -e " ${YELLOW}⚠${NC} (API running but health check failed)"
    fi
else
    echo -e "${RED}✗ API Server is not running on port $API_PORT${NC}"
    echo ""
    echo "To start the API server:"
    echo "  cd backend"
    echo "  npm run dev"
    echo ""
    read -p "Would you like to start the API server now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Starting API server in background..."
        cd backend && npm run dev &
        API_PID=$!
        echo "API server started with PID: $API_PID"
        echo "Waiting for API to be ready..."
        sleep 5
        wait_for_service "API Server" "$API_PORT" "$WAIT_TIMEOUT"
    else
        exit 1
    fi
fi

# Environment summary
echo -e "\n📊 Environment Summary"
echo "---------------------"
echo "API URL: $API_URL"
echo "Database: $DB_HOST:$DB_PORT"
echo "Working Directory: $(pwd)"
echo ""

# Run the tests
echo -e "\n🧪 Running End-to-End Tests"
echo "=========================="
echo ""

# Set environment variables and run tests
export API_URL
export NODE_ENV=test

# Execute the test script
if [ -f "test-e2e-workflow.js" ]; then
    node test-e2e-workflow.js
    TEST_EXIT_CODE=$?
else
    echo -e "${RED}✗ test-e2e-workflow.js not found${NC}"
    exit 1
fi

# Post-test actions
echo -e "\n📄 Test Reports"
echo "---------------"

# Find the most recent test report
LATEST_REPORT=$(ls -t test-report-*.json 2>/dev/null | head -1)

if [ -n "$LATEST_REPORT" ]; then
    echo "Latest report: $LATEST_REPORT"
    
    # Extract summary using node
    if command_exists jq; then
        echo ""
        echo "Summary:"
        jq '.summary' "$LATEST_REPORT"
    else
        echo ""
        echo "Install 'jq' to view formatted report summary"
    fi
else
    echo "No test report found"
fi

# Cleanup if API was started by this script
if [ -n "$API_PID" ]; then
    echo -e "\n🧹 Cleanup"
    echo "----------"
    echo "Stopping API server (PID: $API_PID)..."
    kill $API_PID 2>/dev/null || true
fi

# Exit with test exit code
exit $TEST_EXIT_CODE