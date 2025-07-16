#!/bin/bash

echo "🔍 SMS Deployment Health Check"
echo "=============================="
echo ""
echo "Please enter your Railway URLs:"
echo ""

read -p "Onboarding Backend URL (e.g., https://onboarding-backend.up.railway.app): " ONBOARDING_BACKEND
read -p "Maintenance Backend URL (e.g., https://maintenance-backend.up.railway.app): " MAINTENANCE_BACKEND

echo ""
echo "Checking services..."
echo ""

# Check Onboarding Backend
echo "1. Onboarding Backend Health:"
curl -s -o /dev/null -w "   Status: %{http_code}\n" "$ONBOARDING_BACKEND/api/health" || echo "   Status: Failed to connect"

# Check Maintenance Backend  
echo ""
echo "2. Maintenance Backend Health:"
curl -s -o /dev/null -w "   Status: %{http_code}\n" "$MAINTENANCE_BACKEND/api/health" || echo "   Status: Failed to connect"

echo ""
echo "3. Testing Onboarding API:"
curl -s "$ONBOARDING_BACKEND/api/auth/health" | jq '.' 2>/dev/null || echo "   No JSON response"

echo ""
echo "4. Testing Maintenance API:"
curl -s "$MAINTENANCE_BACKEND/api/health" | jq '.' 2>/dev/null || echo "   No JSON response"

echo ""
echo "=============================="
echo "✅ Health check complete!"
echo ""
echo "Expected results:"
echo "- Status: 200 = Service is healthy"
echo "- Status: 404 = Service running but health endpoint missing"
echo "- Failed to connect = Service not accessible"