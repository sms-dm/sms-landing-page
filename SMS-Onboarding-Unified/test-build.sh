#!/bin/bash

# SMS Onboarding Portal - Build Test Script

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SMS Onboarding Portal - Build Test    ${NC}"
echo -e "${BLUE}========================================${NC}"

# Track errors
ERRORS=0

# Function to test a build step
test_step() {
    local step_name=$1
    local command=$2
    
    echo -e "${YELLOW}Testing: $step_name...${NC}"
    
    if eval $command; then
        echo -e "${GREEN}✓ $step_name passed${NC}"
    else
        echo -e "${RED}✗ $step_name failed${NC}"
        ((ERRORS++))
    fi
    echo ""
}

# Test TypeScript compilation
echo -e "${BLUE}=== Testing TypeScript Compilation ===${NC}"
test_step "Frontend TypeScript Check" "npm run type-check"
test_step "Backend TypeScript Check" "cd backend && npx tsc --noEmit && cd .."

# Test build processes
echo -e "${BLUE}=== Testing Build Processes ===${NC}"
test_step "Frontend Build" "npm run build"
test_step "Backend Build" "cd backend && npm run build && cd .."

# Test Prisma schema validation
echo -e "${BLUE}=== Testing Database Schema ===${NC}"
test_step "Prisma Schema Validation" "cd backend && npm run db:validate && cd .."

# Check for build outputs
echo -e "${BLUE}=== Checking Build Outputs ===${NC}"
if [ -d "dist" ]; then
    echo -e "${GREEN}✓ Frontend build output exists (dist/)${NC}"
    echo -e "  Files: $(find dist -type f | wc -l)"
else
    echo -e "${RED}✗ Frontend build output missing${NC}"
    ((ERRORS++))
fi

if [ -d "backend/dist" ]; then
    echo -e "${GREEN}✓ Backend build output exists (backend/dist/)${NC}"
    echo -e "  Files: $(find backend/dist -type f | wc -l)"
else
    echo -e "${RED}✗ Backend build output missing${NC}"
    ((ERRORS++))
fi

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}Build test completed successfully!${NC}"
    echo -e "${GREEN}All build processes are working correctly.${NC}"
else
    echo -e "${RED}Build test completed with $ERRORS error(s)${NC}"
    echo -e "${YELLOW}Please fix the errors before deployment.${NC}"
fi
echo -e "${BLUE}========================================${NC}"

exit $ERRORS