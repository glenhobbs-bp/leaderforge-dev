#!/bin/bash

# Development Stop Script for LeaderForge
# Cleanly stops all development services

echo "🛑 Stopping LeaderForge development environment..."

# Stop services using saved PIDs if available
if [ -f ".web-dev.pid" ]; then
    WEB_PID=$(cat .web-dev.pid)
    echo "Stopping web server (PID: $WEB_PID)..."
    kill $WEB_PID 2>/dev/null
    rm .web-dev.pid
fi

if [ -f ".langgraph-dev.pid" ]; then
    LANGGRAPH_PID=$(cat .langgraph-dev.pid)
    echo "Stopping LangGraph server (PID: $LANGGRAPH_PID)..."
    kill $LANGGRAPH_PID 2>/dev/null
    rm .langgraph-dev.pid
fi

# Fallback: kill by process name
echo "Killing any remaining development processes..."
pkill -f "next dev" 2>/dev/null
pkill -f "langgraph" 2>/dev/null
pkill -f "tsx.*src/index" 2>/dev/null

# Wait for processes to terminate
sleep 2

# Verify cleanup
REMAINING=$(ps aux | grep -E "(next dev|langgraph)" | grep -v grep | wc -l)
if [ $REMAINING -eq 0 ]; then
    echo "✅ All development services stopped successfully"
else
    echo "⚠️  Some processes may still be running"
    ps aux | grep -E "(next dev|langgraph)" | grep -v grep
fi