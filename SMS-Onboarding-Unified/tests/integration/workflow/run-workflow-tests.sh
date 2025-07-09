#!/bin/bash

# Run Workflow Tests Script
# This script sets up the environment and runs the complete onboarding workflow tests

set -e

echo "🚀 Starting Onboarding Workflow Tests"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000/api}"
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/sms_onboarding}"
TEST_ENV="${TEST_ENV:-local}"

# Function to check if service is running
check_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    echo -n "Checking $service_name..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo -e " ${RED}✗${NC}"
    return 1
}

# Function to run tests
run_tests() {
    local test_file=$1
    echo -e "\n${YELLOW}Running: $test_file${NC}"
    
    # Run with Jest or Vitest
    if command -v vitest &> /dev/null; then
        API_URL=$API_URL vitest run "$test_file" --reporter=verbose
    else
        API_URL=$API_URL jest "$test_file" --verbose
    fi
}

# Pre-flight checks
echo -e "\n📋 Pre-flight Checks"
echo "-------------------"

# Check if API is running
if ! check_service "API" "$API_URL/health"; then
    echo -e "${RED}Error: API is not running at $API_URL${NC}"
    echo "Please start the API server first with: npm run dev:backend"
    exit 1
fi

# Check if database is accessible
if command -v psql &> /dev/null; then
    echo -n "Checking database connection..."
    if psql "$DB_URL" -c "SELECT 1" > /dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC}"
    else
        echo -e " ${YELLOW}⚠${NC} (Database check failed, but tests may still work)"
    fi
else
    echo -e "${YELLOW}Warning: psql not found, skipping database check${NC}"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "\n📦 Installing dependencies..."
    npm install
fi

# Run database migrations if in test environment
if [ "$TEST_ENV" = "test" ]; then
    echo -e "\n🗄️  Running database migrations..."
    npx prisma migrate deploy
fi

# Main test execution
echo -e "\n🧪 Running Workflow Tests"
echo "========================"

# Run the complete workflow test
run_tests "tests/integration/workflow/onboarding-workflow.test.ts"

# Run specific workflow components if they exist
if [ -f "tests/integration/workflow/admin-workflow.test.ts" ]; then
    run_tests "tests/integration/workflow/admin-workflow.test.ts"
fi

if [ -f "tests/integration/workflow/technician-workflow.test.ts" ]; then
    run_tests "tests/integration/workflow/technician-workflow.test.ts"
fi

if [ -f "tests/integration/workflow/manager-workflow.test.ts" ]; then
    run_tests "tests/integration/workflow/manager-workflow.test.ts"
fi

# Generate test report
echo -e "\n📊 Test Summary"
echo "==============="

# If coverage is enabled
if [ "$COVERAGE" = "true" ]; then
    echo -e "\n📈 Generating coverage report..."
    npx vitest run --coverage
fi

echo -e "\n${GREEN}✅ Workflow tests completed!${NC}"
echo -e "\nTest results are available in the test output above."
echo -e "For detailed logs, check: ./tests/logs/workflow-test.log"

# Exit with appropriate code
exit 0