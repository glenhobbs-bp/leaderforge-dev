import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
import { createContentLibraryAgent } from "agent-core";

/**
 * POST /api/agent/content
 * Agent-native: invokes the LangGraph ContentLibraryAgent.
 * Expects { userId, contextKey, intent } in the request body.
 * Returns the schema built by the agent.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[API] /api/agent/content POST body:', body);
    const { userId, contextKey, intent } = body;
    // TODO: Look up agent by navOptionId for true modularity
    const agent = createContentLibraryAgent();
    // Always construct a fully-initialized state object
    const initialState = {
      userId: userId || '',
      contextKey: contextKey || '',
      intent: intent,
      contentList: [],
      progressMap: {},
      schema: null,
      updateResult: null,
      __input: {
        userId: userId || '',
        contextKey: contextKey || '',
        intent: intent,
      },
    };
    console.log('[API] Invoking agent with initialState:', initialState);
    const result = await agent.invoke(initialState);
    console.log('[API] Agent result:', result);
    console.log('[API] Agent result.schema:', result.schema);
    return NextResponse.json(result.schema);
  } catch (error) {
    console.error("[API] Error in /api/agent/content:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// (Optional) Remove or update the GET handler if not needed.