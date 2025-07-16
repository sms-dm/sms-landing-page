#!/bin/bash

echo "🚀 Starting SMS Applications..."
echo "================================"

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $1 is already in use. Stopping existing process..."
        lsof -ti:$1 | xargs kill -9 2>/dev/null
        sleep 2
    fi
}

# Check and clear ports
check_port 3005  # Maintenance Backend
check_port 3000  # Maintenance Frontend
check_port 3001  # Onboarding Portal
check_port 3002  # Landing Page

# Start Maintenance Portal Backend
echo "1️⃣ Starting Maintenance Portal Backend (port 3005)..."
cd /home/sms/repos/SMS/sms-app/backend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Maintenance Backend dependencies..."
    npm install
fi
npm run dev > maintenance-backend.log 2>&1 &
MAINTENANCE_BACKEND_PID=$!
sleep 3

# Start Maintenance Portal Frontend
echo "2️⃣ Starting Maintenance Portal Frontend (port 3000)..."
cd /home/sms/repos/SMS/sms-app/frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Maintenance Frontend dependencies..."
    npm install
fi
PORT=3000 npm start > maintenance-frontend.log 2>&1 &
MAINTENANCE_FRONTEND_PID=$!
sleep 3

# Start Onboarding Portal
echo "3️⃣ Starting Onboarding Portal (port 3001)..."
cd /home/sms/repos/SMS/SMS-Onboarding-Unified
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Onboarding Portal dependencies..."
    npm install
fi
npm run dev > onboarding-portal.log 2>&1 &
ONBOARDING_PORTAL_PID=$!
sleep 3

# Start Landing Page
echo "4️⃣ Starting SMS Landing Page (port 3002)..."
cd /home/sms/repos/SMS/sms-landing
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Landing Page dependencies..."
    npm install
fi
npm run dev > landing-page.log 2>&1 &
LANDING_PAGE_PID=$!

# Wait a bit for everything to start
sleep 5

echo ""
echo "✅ All applications started!"
echo "================================"
echo ""
echo "🌐 Access your applications at:"
echo "   SMS Landing Page:       http://localhost:3002  ← START HERE!"
echo "   Maintenance Portal:     http://localhost:3000"
echo "   Onboarding Portal:      http://localhost:3001"
echo ""
echo "📊 API endpoints:"
echo "   Maintenance API:        http://localhost:3005"
echo ""
echo "🔐 Demo Login Credentials:"
echo "   Admin:      admin / admin123"
echo "   Technician: john_tech / admin123"
echo ""
echo "📝 Logs are saved in each app directory"
echo ""
echo "🛑 To stop all applications, run: ./stop-all.sh"
echo ""

# Save PIDs to file for stop script
echo "$MAINTENANCE_BACKEND_PID" > /home/sms/repos/SMS/.pids
echo "$MAINTENANCE_FRONTEND_PID" >> /home/sms/repos/SMS/.pids
echo "$ONBOARDING_PORTAL_PID" >> /home/sms/repos/SMS/.pids
echo "$LANDING_PAGE_PID" >> /home/sms/repos/SMS/.pids

# Keep script running
echo "Press Ctrl+C to stop all applications..."
wait