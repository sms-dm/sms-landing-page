#!/bin/bash

# Test login to Onboarding Portal
echo "Testing login to Onboarding Portal..."

response=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Demo123!"}' \
  -s)

echo "Response: $response"

# Extract token if successful
if [[ $response == *"accessToken"* ]]; then
  token=$(echo $response | grep -o '"accessToken":"[^"]*' | grep -o '[^"]*$')
  echo "Token extracted: ${token:0:20}..."
  
  # Test getting vessels
  echo -e "\nTesting vessel endpoint..."
  curl -X GET http://localhost:3001/api/vessels \
    -H "Authorization: Bearer $token" \
    -s
fi