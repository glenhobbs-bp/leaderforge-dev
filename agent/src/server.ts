// File: agent/src/server.ts
// Purpose: Simple HTTP server wrapper for LangGraph agent testing
// Owner: AI team
// Tags: HTTP server, LangGraph wrapper, testing

import { createServer } from 'http';
import graph from './index';

const PORT = 8000;

// Store the last successful result for state retrieval
let lastSuccessfulResult: any = null;

const server = createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'langgraph-agent' }));
    return;
  }

  // Create thread endpoint (mock)
  if (req.url === '/threads' && req.method === 'POST') {
    const threadId = `thread_${Date.now()}`;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ thread_id: threadId }));
    return;
  }

  // Run agent endpoint
  if (req.url?.startsWith('/threads/') && req.url?.includes('/runs') && req.method === 'POST') {
    const threadId = req.url.split('/')[2];

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const request = JSON.parse(body);
        const input = request.input || {};

        console.log('[Agent Server] Received request:', {
          threadId,
          input: {
            context: input.context,
            messages: input.messages?.length || 0
          }
        });

        // Run the graph
        const result = await graph.invoke({
          userId: input.context?.userId || 'test-user',
          contextKey: input.context?.contextKey || 'leaderforge',
          navOptionId: input.context?.navOptionId || 'test-nav',
          intent: input.messages?.[0]?.content || 'Show content',
          contentList: [],
          schema: null,
          messages: input.messages || []
        });

        // Store the result for state retrieval
        lastSuccessfulResult = result;

        const runId = `run_${Date.now()}`;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          run_id: runId,
          status: 'success',
          result
        }));

      } catch (error) {
        console.error('[Agent Server] Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: error.message,
          status: 'error'
        }));
      }
    });
    return;
  }

  // Get run status (mock - return success immediately)
  if (req.url?.includes('/runs/') && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'success' }));
    return;
  }

    // Get thread state - return the stored result from the run
  if (req.url?.includes('/state') && req.method === 'GET') {
    // Extract threadId from URL
    const urlParts = req.url.split('/');
    const threadId = urlParts[2];

    // In a real implementation, we'd store results per thread
    // For now, return the last successful result if available
    if (lastSuccessfulResult) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        values: lastSuccessfulResult
      }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'No state available for thread',
        values: { schema: null }
      }));
    }
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`[Agent Server] LangGraph agent server running on http://localhost:${PORT}`);
  console.log(`[Agent Server] Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Agent Server] Shutting down gracefully...');
  server.close(() => {
    console.log('[Agent Server] Server closed');
    process.exit(0);
  });
});