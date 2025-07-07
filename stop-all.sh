#!/bin/bash

echo "🛑 Stopping all SMS applications..."

# Kill using ports
echo "Stopping services on ports..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
lsof -ti:5174 | xargs kill -9 2>/dev/null

# Also kill by PID if available
if [ -f /home/sms/repos/SMS/.pids ]; then
    while read pid; do
        kill -9 $pid 2>/dev/null
    done < /home/sms/repos/SMS/.pids
    rm /home/sms/repos/SMS/.pids
fi

echo "✅ All applications stopped!"