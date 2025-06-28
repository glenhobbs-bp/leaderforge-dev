#!/bin/bash

# Development Startup Script for LeaderForge
# Ensures clean startup of all development services

# set -e  # Exit on any error
trap 'echo "❌ Script failed on line $LINENO. Press Enter to exit..."; read' ERR

echo "🚀 Starting LeaderForge development environment..."


# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    echo "Please run this script from the leaderforge-dev directory"
    read -p "Press Enter to exit..."
    exit 1
fi

sleep 2

# Run cleanup first
echo "Running session cleanup..."
if [ -f "./cleanup-sessions.sh" ]; then
    ./cleanup-sessions.sh
else
    echo "⚠️  Warning: cleanup-sessions.sh not found, skipping cleanup"
fi

# Wait a moment for cleanup to complete
sleep 5

# Check if apps/web exists
if [ ! -d "apps/web" ]; then
    echo "❌ Error: apps/web directory not found"
    read -p "Press Enter to exit..."
    exit 1
fi

# Start web development server
echo "Starting web development server..."
cd apps/web

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm not found. Please install pnpm first:"
    echo "npm install -g pnpm"
    read -p "Press Enter to exit..."
    exit 1
fi

# Start the web server
echo "Running: pnpm dev"
pnpm dev &
WEB_PID=$!
echo "Web server started with PID: $WEB_PID"

# Return to project root
cd ../..

# Wait for web server to initialize
echo "Waiting for web server to initialize..."
sleep 5

# Debug: Check current directory and list contents
echo "🔍 Debug: Current directory: $(pwd)"
echo "🔍 Debug: Directory contents:"
ls -la | head -10

# Check if agent directory exists
echo "🔍 Debug: Checking for agent directory..."
if [ ! -d "agent" ]; then
    echo "⚠️  Warning: agent directory not found, skipping LangGraph server"
    echo "🔍 Debug: Looking for 'agent' in: $(pwd)"
    echo "🔍 Debug: Available directories:"
    ls -d */ 2>/dev/null || echo "No directories found"
    LANGGRAPH_PID="N/A"
else
    echo "✅ Agent directory found!"
    # Skip LangGraph server - using Render deployment instead
    echo "🌐 Using Render-deployed LangGraph service instead of local server"
    echo "🔗 LangGraph URL: https://leaderforge-langgraph-2.onrender.com"
    LANGGRAPH_PID="N/A"

    # Comment out the local LangGraph startup code
    # echo "Starting LangGraph server..."
    # cd agent
    # if ! command -v npx &> /dev/null; then
    #     echo "❌ Error: npx not found"
    #     read -p "Press Enter to exit..."
    #     exit 1
    # fi
    # echo "Running: npx @langchain/langgraph-cli dev --host 127.0.0.1 --port 8000"
    # if [ -f "../.env.local" ]; then
    #     export $(grep -v '^#' ../.env.local | xargs)
    # fi
    # npx @langchain/langgraph-cli dev --host 127.0.0.1 --port 8000 &
    # LANGGRAPH_PID=$!
    # echo "LangGraph server started with PID: $LANGGRAPH_PID"
    # cd ..
fi

# Wait for services to initialize
echo "Waiting for services to initialize..."
sleep 5

# Test endpoints
echo "Testing endpoints..."
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
# Test Render-deployed LangGraph service
RENDER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://leaderforge-langgraph-2.onrender.com/health || echo "000")

echo "📊 Service Status:"
echo "  Web server (port 3000): HTTP $WEB_STATUS"
echo "  LangGraph server (Render): HTTP $RENDER_STATUS"

# Save PIDs for easy cleanup later
echo "$WEB_PID" > .web-dev.pid
if [ "$LANGGRAPH_PID" != "N/A" ]; then
    echo "$LANGGRAPH_PID" > .langgraph-dev.pid
fi

echo ""
echo "✅ Development environment ready!"
echo "📱 Web: http://localhost:3000"
echo "🤖 LangGraph: https://leaderforge-langgraph-2.onrender.com (Render deployment)"
echo ""
echo "🛑 To stop services, run: ./stop-dev.sh"
echo "📋 To view logs, check the terminal output above"
echo ""
echo "Press Ctrl+C to stop all services, or close this terminal to keep them running"

# Keep the script running so you can see the output
wait