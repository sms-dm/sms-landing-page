#!/bin/bash

# Authentication Integration Tests Runner
# This script runs all authentication-related integration tests

echo "=================================="
echo "SMS Onboarding - Auth Tests"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to backend directory
cd /home/sms/repos/SMS/SMS-Onboarding-Unified/backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Run individual test suites
echo -e "${GREEN}Running Login/Logout Flow Tests...${NC}"
npm test tests/integration/auth/login-logout.test.ts
LOGIN_RESULT=$?

echo ""
echo -e "${GREEN}Running Role-Based Access Tests...${NC}"
npm test tests/integration/auth/role-access.test.ts
ROLE_RESULT=$?

echo ""
echo -e "${GREEN}Running JWT Verification Tests...${NC}"
npm test tests/integration/auth/jwt-verification.test.ts
JWT_RESULT=$?

echo ""
echo -e "${GREEN}Running Refresh Token Tests...${NC}"
npm test tests/integration/auth/refresh-token.test.ts
REFRESH_RESULT=$?

# Summary
echo ""
echo "=================================="
echo "Test Results Summary"
echo "=================================="

if [ $LOGIN_RESULT -eq 0 ]; then
    echo -e "Login/Logout Tests: ${GREEN}PASSED${NC}"
else
    echo -e "Login/Logout Tests: ${RED}FAILED${NC}"
fi

if [ $ROLE_RESULT -eq 0 ]; then
    echo -e "Role Access Tests: ${GREEN}PASSED${NC}"
else
    echo -e "Role Access Tests: ${RED}FAILED${NC}"
fi

if [ $JWT_RESULT -eq 0 ]; then
    echo -e "JWT Verification Tests: ${GREEN}PASSED${NC}"
else
    echo -e "JWT Verification Tests: ${RED}FAILED${NC}"
fi

if [ $REFRESH_RESULT -eq 0 ]; then
    echo -e "Refresh Token Tests: ${GREEN}PASSED${NC}"
else
    echo -e "Refresh Token Tests: ${RED}FAILED${NC}"
fi

# Overall result
if [ $LOGIN_RESULT -eq 0 ] && [ $ROLE_RESULT -eq 0 ] && [ $JWT_RESULT -eq 0 ] && [ $REFRESH_RESULT -eq 0 ]; then
    echo ""
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}Some tests failed. Please check the output above.${NC}"
    exit 1
fi