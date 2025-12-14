#!/bin/bash

# Session Monitoring Script for LeaderForge
# Helps track terminal sessions and development processes

echo "📊 LeaderForge Session Monitor"
echo "================================"

# Count shell sessions
SHELL_COUNT=$(ps aux | grep -E "(zsh|bash)" | grep -v grep | wc -l)
echo "🐚 Shell sessions: $SHELL_COUNT"

if [ $SHELL_COUNT -gt 3 ]; then
    echo "⚠️  Warning: High number of shell sessions detected!"
    echo "   Consider running ./cleanup-sessions.sh"
fi

echo ""

# Show development processes
echo "🚀 Development processes:"
DEV_PROCESSES=$(ps aux | grep -E "(next dev|langgraph|tsx.*src/index)" | grep -v grep)
if [ -z "$DEV_PROCESSES" ]; then
    echo "   None running"
else
    echo "$DEV_PROCESSES" | while read line; do
        echo "   $line"
    done
fi

echo ""

# Check port usage
echo "🔌 Port usage:"
PORT_3000=$(lsof -ti:3000 2>/dev/null)
PORT_8000=$(lsof -ti:8000 2>/dev/null)

if [ -n "$PORT_3000" ]; then
    echo "   Port 3000: ✅ In use (PID: $PORT_3000)"
else
    echo "   Port 3000: ❌ Available"
fi

if [ -n "$PORT_8000" ]; then
    echo "   Port 8000: ✅ In use (PID: $PORT_8000)"
else
    echo "   Port 8000: ❌ Available"
fi

echo ""

# Check service status
echo "🌐 Service status:"
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
LANGGRAPH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/info 2>/dev/null)

if [ "$WEB_STATUS" = "200" ] || [ "$WEB_STATUS" = "307" ]; then
    echo "   Web server: ✅ Responding (HTTP $WEB_STATUS)"
else
    echo "   Web server: ❌ Not responding"
fi

if [ "$LANGGRAPH_STATUS" = "200" ]; then
    echo "   LangGraph server: ✅ Responding (HTTP $LANGGRAPH_STATUS)"
else
    echo "   LangGraph server: ❌ Not responding"
fi

echo ""
echo "📝 Quick commands:"
echo "   ./cleanup-sessions.sh  - Clean up orphaned sessions"
echo "   ./start-dev.sh         - Start development environment"
echo "   ./stop-dev.sh          - Stop development environment"