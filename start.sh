#!/bin/bash
# Resume Builder - Start Script
cd "$(dirname "$0")"

# Kill any existing server
pkill -f "node server.js" 2>/dev/null
sleep 1

# Start the Express server
echo "Starting Resume Builder server..."
nohup node server.js > server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > server.pid
echo "Server started with PID: $SERVER_PID"
echo "Access at: http://localhost:3000"
echo ""
echo "To stop: kill \$(cat server.pid)"
echo "To view logs: tail -f server.log"
