#!/bin/bash

# Test Production Setup Locally
# This script tests the two-service architecture locally before deploying

echo "🧪 Testing LeaderForge Production Setup Locally"
echo "================================================"

# Kill any existing processes
echo "🛑 Stopping existing services..."
pkill -f "next dev" 2>/dev/null
pkill -f "tsx.*server" 2>/dev/null
sleep 2

# Start LangGraph service
echo "🤖 Starting LangGraph service..."
cd agent
npm start &
LANGGRAPH_PID=$!
cd ..

# Wait for LangGraph to start
echo "⏳ Waiting for LangGraph service to start..."
sleep 5

# Test LangGraph health check
echo "🔍 Testing LangGraph health check..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/health || echo "FAILED")
if [[ $HEALTH_RESPONSE == *"ok"* ]]; then
    echo "✅ LangGraph service is healthy"
else
    echo "❌ LangGraph service failed to start"
    echo "Response: $HEALTH_RESPONSE"
    kill $LANGGRAPH_PID 2>/dev/null
    exit 1
fi

# Build web app for production
echo "🏗️  Building web application..."
cd apps/web
npm run build

# Start web app in production mode
echo "🌐 Starting web application..."
export LANGGRAPH_URL="http://localhost:8000"
npm start &
WEB_PID=$!
cd ../..

# Wait for web app to start
echo "⏳ Waiting for web application to start..."
sleep 10

# Test web app
echo "🔍 Testing web application..."
WEB_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [[ $WEB_RESPONSE == "200" ]]; then
    echo "✅ Web application is running"
else
    echo "❌ Web application failed to start (HTTP: $WEB_RESPONSE)"
fi

# Test agent content API
echo "🔍 Testing agent content API integration..."
# Note: This would require authentication, so we just test the endpoint exists
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/agent/content \
  -H "Content-Type: application/json" \
  -d '{}' || echo "000")

if [[ $API_RESPONSE == "400" ]] || [[ $API_RESPONSE == "401" ]]; then
    echo "✅ Agent API endpoint is responding (HTTP: $API_RESPONSE)"
else
    echo "⚠️  Agent API unexpected response (HTTP: $API_RESPONSE)"
fi

echo ""
echo "📊 Test Results:"
echo "  🤖 LangGraph Service: $([ "$HEALTH_RESPONSE" != "FAILED" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "  🌐 Web Application: $([ "$WEB_RESPONSE" == "200" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "  🔗 API Integration: $([ "$API_RESPONSE" == "400" ] || [ "$API_RESPONSE" == "401" ] && echo "✅ PASS" || echo "⚠️  CHECK")"

echo ""
echo "🏃 Services running on:"
echo "  LangGraph: http://localhost:8000"
echo "  Web App: http://localhost:3000"
echo ""
echo "📝 To deploy to production:"
echo "  1. Deploy LangGraph to Railway: railway up"
echo "  2. Update LANGGRAPH_URL in Vercel settings"
echo "  3. Redeploy Vercel: git push origin main"
echo ""
echo "🛑 Press Ctrl+C to stop all services"

# Keep services running until user stops
trap "echo ''; echo '🛑 Stopping services...'; kill $LANGGRAPH_PID $WEB_PID 2>/dev/null; exit" INT
wait