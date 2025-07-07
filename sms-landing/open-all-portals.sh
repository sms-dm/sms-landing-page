#\!/bin/bash

echo "🚀 Opening all SMS portals in your browser..."
echo "================================"

# Function to open URL based on OS
open_url() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "$1" 2>/dev/null || echo "Please open manually: $1"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        open "$1"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        start "$1"
    else
        echo "Please open manually: $1"
    fi
}

# Open all three portals
echo "📍 Opening SMS Landing Page (http://localhost:3002)..."
open_url "http://localhost:3002"
sleep 1

echo "📍 Opening Maintenance Portal (http://localhost:3000/oceanic)..."
open_url "http://localhost:3000/oceanic"
sleep 1

echo "📍 Opening Onboarding Portal (http://localhost:3001)..."
open_url "http://localhost:3001"

echo ""
echo "✅ All portals should be opening in your browser\!"
echo ""
echo "🔐 Login Credentials:"
echo "   Maintenance Portal: john.doe@oceanic.com / demo123"
echo "   Onboarding Portal: admin@smsportal.com / demo123"
echo "================================"
