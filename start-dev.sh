#!/bin/bash

# Development Startup Script for LeaderForge
# Ensures clean startup of all development services

echo "🚀 Starting LeaderForge development environment..."

# Run cleanup first
echo "Running session cleanup..."
./cleanup-sessions.sh

# Wait a moment for cleanup to complete
sleep 2

# Start web development server
echo "Starting web development server..."
cd apps/web
npm run dev &
WEB_PID=$!
echo "Web server started with PID: $WEB_PID"

# Wait for web server to initialize
sleep 3

# Start LangGraph server
echo "Starting LangGraph server..."
cd ../agent
npx @langchain/langgraph-cli dev --port 8000 &
LANGGRAPH_PID=$!
echo "LangGraph server started with PID: $LANGGRAPH_PID"

# Return to project root
cd ..

# Wait for services to initialize
echo "Waiting for services to initialize..."
sleep 5

# Test endpoints
echo "Testing endpoints..."
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
LANGGRAPH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/info)

echo "Web server (port 3000): HTTP $WEB_STATUS"
echo "LangGraph server (port 8000): HTTP $LANGGRAPH_STATUS"

# Save PIDs for easy cleanup later
echo "$WEB_PID" > .web-dev.pid
echo "$LANGGRAPH_PID" > .langgraph-dev.pid

echo "✅ Development environment ready!"
echo "📱 Web: http://localhost:3000"
echo "🤖 LangGraph: http://localhost:8000"
echo ""
echo "To stop services, run: ./stop-dev.sh"