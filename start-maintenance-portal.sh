#!/bin/bash

echo "Starting SMS Maintenance Portal..."

# Kill any existing processes on the ports
echo "Cleaning up old processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3005 | xargs kill -9 2>/dev/null || true

# Start backend on port 3005 (as frontend expects)
echo "Starting backend API on port 3005..."
cd /home/sms/repos/SMS/sms-app/backend
PORT=3005 npm start &

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Start frontend on port 3000
echo "Starting frontend on port 3000..."
cd /home/sms/repos/SMS/sms-app/frontend
npm start &

echo ""
echo "✅ Maintenance Portal is starting!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 API: http://localhost:3005"
echo ""
echo "🏢 Access the portal at: http://localhost:3000/oceanic"
echo ""
echo "📧 Test Credentials:"
echo "   Technician: john.doe@oceanic.com / demo123"
echo "   Manager: tom.rodriguez@oceanic.com / demo123"
echo "   Admin: admin@smsportal.com / demo123"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait