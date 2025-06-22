#!/bin/bash

# Session Cleanup Script for LeaderForge Development
# Prevents orphaned development processes and clears caches safely

echo "🧹 Starting development cleanup..."

# Count development processes before cleanup
NEXT_COUNT=$(ps aux | grep -E "next.*dev" | grep -v grep | wc -l)
LANGGRAPH_COUNT=$(ps aux | grep -E "langgraph" | grep -v grep | wc -l)
NODE_COUNT=$(ps aux | grep -E "node.*(3000|8000)" | grep -v grep | wc -l)

echo "Development processes found:"
echo "  Next.js dev servers: $NEXT_COUNT"
echo "  LangGraph servers: $LANGGRAPH_COUNT"
echo "  Node processes on dev ports: $NODE_COUNT"

# Kill only specific development processes (much safer)
echo "Killing development processes..."

# Kill Next.js development servers
pkill -f "next.*dev" 2>/dev/null
pkill -f "pnpm.*dev" 2>/dev/null
pkill -f "npm.*dev" 2>/dev/null

# Kill LangGraph servers
pkill -f "langgraph.*dev" 2>/dev/null
pkill -f "@langchain/langgraph-cli" 2>/dev/null

# Kill specific Node.js processes on development ports
pkill -f "node.*3000" 2>/dev/null
pkill -f "node.*8000" 2>/dev/null

# Kill Turbo daemon if running
pkill -f "turbo.*daemon" 2>/dev/null

# Clear development caches
echo "Clearing development caches..."

# Clear Next.js cache
if [ -d "apps/web/.next" ]; then
    echo "  Clearing Next.js cache..."
    rm -rf apps/web/.next
fi

# Clear Turbo cache
if [ -d "apps/web/.turbo" ]; then
    echo "  Clearing Turbo cache..."
    rm -rf apps/web/.turbo
fi

# Clear node_modules cache directories
if [ -d "apps/web/node_modules/.cache" ]; then
    echo "  Clearing node_modules cache..."
    rm -rf apps/web/node_modules/.cache
fi

if [ -d "node_modules/.cache" ]; then
    echo "  Clearing root node_modules cache..."
    rm -rf node_modules/.cache
fi

# Wait a moment for processes to fully terminate
sleep 2

# Show remaining development processes
echo "Remaining development processes:"
ps aux | grep -E "(next.*dev|langgraph|node.*(3000|8000))" | grep -v grep || echo "  None found ✅"

echo "✅ Development cleanup complete!"
echo "🔧 Caches cleared, development processes stopped"