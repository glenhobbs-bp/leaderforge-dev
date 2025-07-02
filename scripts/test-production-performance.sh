#!/bin/bash

# Production Performance Testing Script
# Purpose: Test critical API endpoints for performance bottlenecks
# Usage: ./scripts/test-production-performance.sh https://your-production-url.com

PROD_URL=${1:-"https://your-production-url.com"}
USER_ID="test-user-123"
TENANT_KEY="leaderforge"
NAV_OPTION_ID="3202016b-05fa-4db6-bbc7-c785ba898e2f"

echo "🚀 Testing Production Performance: $PROD_URL"
echo "=============================================="

# Test 1: Agent Content API (Primary bottleneck)
echo "📊 Testing Agent Content API..."
time curl -s -w "\n⏱️  Time: %{time_total}s | TTFB: %{time_starttransfer}s | Connect: %{time_connect}s\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"tenantKey\":\"$TENANT_KEY\",\"navOptionId\":\"$NAV_OPTION_ID\"}" \
  "$PROD_URL/api/agent/content" | head -5

echo ""

# Test 2: Universal Progress API (Batching test)
echo "📊 Testing Universal Progress API..."
time curl -s -w "\n⏱️  Time: %{time_total}s | TTFB: %{time_starttransfer}s\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"batchTrackProgress\",\"events\":[{\"userId\":\"$USER_ID\",\"contentId\":\"test-content\",\"tenantKey\":\"$TENANT_KEY\",\"progressType\":\"video\",\"value\":50,\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"}]}" \
  "$PROD_URL/api/universal-progress" | head -3

echo ""

# Test 3: Navigation State API
echo "📊 Testing Navigation State API..."
time curl -s -w "\n⏱️  Time: %{time_total}s | TTFB: %{time_starttransfer}s\n" \
  -X GET \
  "$PROD_URL/api/user/$USER_ID/navigation-state" | head -3

echo ""

# Test 4: Authentication Session API
echo "📊 Testing Auth Set-Session API..."
time curl -s -w "\n⏱️  Time: %{time_total}s | TTFB: %{time_starttransfer}s\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"access_token\":\"test-token\",\"refresh_token\":\"test-refresh\"}" \
  "$PROD_URL/api/auth/set-session"

echo ""

# Test 5: Multiple Agent Content calls (cache test)
echo "📊 Testing Agent Content Caching (3 consecutive calls)..."
for i in {1..3}; do
  echo "Call $i:"
  time curl -s -w "⏱️  Time: %{time_total}s\n" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"$USER_ID\",\"tenantKey\":\"$TENANT_KEY\",\"navOptionId\":\"$NAV_OPTION_ID\"}" \
    "$PROD_URL/api/agent/content" > /dev/null
done

echo ""
echo "✅ Production API testing complete!"
echo ""
echo "🎯 Performance Targets:"
echo "   Agent Content API: < 2.0s (currently ~2.6s in dev)"
echo "   Progress API: < 0.5s (currently batched)"
echo "   Navigation API: < 0.3s"
echo "   Auth Session API: < 0.1s"