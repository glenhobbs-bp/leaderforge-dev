#!/bin/bash

# LangGraph Cloud Deployment Script
# Deploys the LeaderForge content agent to LangGraph Cloud

echo "🚀 Deploying LeaderForge Agent to LangGraph Cloud"
echo "================================================="

# Check if required environment variables are set
echo "🔍 Checking environment variables..."

# Check for either LANGSMITH_API_KEY or LANGCHAIN_API_KEY (they're the same)
if [ -z "$LANGSMITH_API_KEY" ] && [ -z "$LANGCHAIN_API_KEY" ]; then
    echo "❌ Error: Neither LANGSMITH_API_KEY nor LANGCHAIN_API_KEY is set"
    echo "   Get your API key from: https://smith.langchain.com/settings"
    echo "   Then run: export LANGSMITH_API_KEY='your-key'"
    exit 1
fi

# Use LANGSMITH_API_KEY if available, otherwise fall back to LANGCHAIN_API_KEY
if [ -n "$LANGSMITH_API_KEY" ]; then
    export LANGCHAIN_API_KEY="$LANGSMITH_API_KEY"
    echo "✅ Using LANGSMITH_API_KEY"
else
    echo "✅ Using LANGCHAIN_API_KEY"
fi

# Check if LangGraph CLI is installed
if ! command -v langgraph &> /dev/null; then
    echo "📦 Installing LangGraph CLI..."
    npm install -g @langchain/langgraph-cli
else
    echo "✅ LangGraph CLI is installed"
fi

# Authenticate with LangGraph Cloud
echo "🔐 Authenticating with LangGraph Cloud..."
langgraph auth --api-key "$LANGCHAIN_API_KEY"

if [ $? -ne 0 ]; then
    echo "❌ Authentication failed"
    exit 1
fi

echo "✅ Authentication successful"

# Navigate to agent directory
cd agent

# Validate agent configuration
echo "🔍 Validating agent configuration..."

if [ ! -f "langgraph.json" ]; then
    echo "❌ Error: langgraph.json not found"
    exit 1
fi

if [ ! -f "src/index.ts" ]; then
    echo "❌ Error: src/index.ts not found"
    exit 1
fi

echo "✅ Agent configuration is valid"

# Deploy to LangGraph Cloud
echo "🚀 Deploying to LangGraph Cloud..."
langgraph deploy

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo "✅ Deployment successful!"

# Get deployment information
echo "📊 Getting deployment information..."
langgraph deployments list

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Copy the deployment URL from above"
echo "2. Add to Vercel environment variables:"
echo "   LANGGRAPH_URL=https://your-deployment.langchain.app"
echo "   LANGCHAIN_API_KEY=$LANGCHAIN_API_KEY"
echo "3. Redeploy Vercel: git push origin main"
echo ""
echo "🔍 Monitor your deployment at: https://smith.langchain.com"
echo "📖 View logs and traces in LangSmith dashboard"