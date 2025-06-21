#!/bin/bash

# Session Cleanup Script for LeaderForge Development
# Prevents orphaned terminal sessions and processes

echo "🧹 Starting session cleanup..."

# Get current session PID to preserve it
CURRENT_PID=$$
echo "Current session PID: $CURRENT_PID"

# Count sessions before cleanup
BEFORE_COUNT=$(ps aux | grep -E "(zsh|bash)" | grep -v grep | wc -l)
echo "Shell sessions before cleanup: $BEFORE_COUNT"

# Kill orphaned shell sessions (preserve current)
echo "Killing orphaned shell sessions..."
ps aux | grep -E "(zsh|bash)" | grep -v grep | grep -v "$CURRENT_PID" | awk '{print $2}' | xargs -I {} kill -9 {} 2>/dev/null

# Kill orphaned development processes
echo "Killing orphaned development processes..."
pkill -f "next dev" 2>/dev/null
pkill -f "langgraph" 2>/dev/null
pkill -f "tsx.*src/index" 2>/dev/null
pkill -f "turbo.*daemon" 2>/dev/null

# Clear Next.js cache if it exists
if [ -d "apps/web/.next" ]; then
    echo "Clearing Next.js cache..."
    rm -rf apps/web/.next
fi

# Count sessions after cleanup
AFTER_COUNT=$(ps aux | grep -E "(zsh|bash)" | grep -v grep | wc -l)
echo "Shell sessions after cleanup: $AFTER_COUNT"

# Show remaining development processes
echo "Remaining development processes:"
ps aux | grep -E "(next|langgraph|tsx|node.*8000|node.*3000)" | grep -v grep || echo "None found ✅"

echo "✅ Session cleanup complete!"