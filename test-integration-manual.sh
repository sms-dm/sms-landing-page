#!/bin/bash

# Manual integration test script

echo "SMS Portal Integration Test"
echo "=========================="

# Test credentials
email="admin@maritimesolutions.com"
password='Admin123!'

# Step 1: Login to Onboarding Portal
echo -e "\n1. Testing login to Onboarding Portal..."
login_response=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$email\",\"password\":\"$password\"}" \
  -s 2>&1)

echo "Login response: $login_response"

# Check if login was successful
if [[ $login_response == *"accessToken"* ]]; then
    # Extract token
    token=$(echo $login_response | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')
    echo "Success! Token: ${token:0:20}..."
    
    # Step 2: Get vessels
    echo -e "\n2. Fetching vessels..."
    vessels_response=$(curl -X GET http://localhost:3001/api/vessels \
      -H "Authorization: Bearer $token" \
      -s)
    echo "Vessels: $vessels_response"
    
    # Step 3: Test auth bridge generation
    echo -e "\n3. Generating bridge token..."
    bridge_response=$(curl -X POST http://localhost:3001/api/auth-bridge/generate \
      -H "Authorization: Bearer $token" \
      -s)
    echo "Bridge response: $bridge_response"
    
    # Step 4: Check Maintenance Portal API
    echo -e "\n4. Checking Maintenance Portal API..."
    maintenance_health=$(curl -X GET http://localhost:3005/api/health -s 2>&1)
    echo "Maintenance API health: $maintenance_health"
    
else
    echo "Login failed! Please check credentials and ensure the Onboarding Portal is running."
    echo "Expected credentials:"
    echo "  Email: admin@maritimesolutions.com"
    echo "  Password: Admin123!"
fi

echo -e "\n=========================="
echo "Portal URLs:"
echo "  Onboarding: http://localhost:3001"
echo "  Maintenance: http://localhost:3000"
echo "  Maintenance API: http://localhost:3005"