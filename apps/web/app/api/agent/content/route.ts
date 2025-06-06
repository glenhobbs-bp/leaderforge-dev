import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { TribeSocialContentTool } from "../../../../../../packages/agent-core/tools/TribeSocialContentTool";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/agent/content
 * Fetches content for a nav option/agent using TribeSocialContentTool.
 * Requires a valid session token (from login or .env for dev).
 * Does NOT handle login/authentication (see separate login route).
 */
export async function POST(req: NextRequest) {
  try {
    const { navOptionId, sessionToken } = await req.json();
    console.log("[API] Received navOptionId:", navOptionId, "sessionToken:", !!sessionToken);

    // Lookup nav option and agent (use correct schema API)
    const { data: navOption, error: navError } = await supabase
      .schema("core")
      .from("nav_options")
      .select("agent_id")
      .eq("id", navOptionId)
      .single();

    if (navError) {
      console.error("[API] navOption lookup error:", navError);
      return NextResponse.json({ error: navError.message }, { status: 500 });
    }
    if (!navOption?.agent_id) {
      console.error("[API] No agent configured for this nav option.", navOption);
      return NextResponse.json({ error: "No agent configured for this nav option." }, { status: 501 });
    }

    // Lookup agent config (use correct schema API)
    const { data: agent, error: agentError } = await supabase
      .schema("core")
      .from("agents")
      .select("*, config")
      .eq("id", navOption.agent_id)
      .single();
    console.log("[API] agent lookup result:", agent, agentError);

    if (agentError || !agent) {
      console.error("[API] Agent not found or misconfigured.", agentError);
      return NextResponse.json({ error: "Agent not found or misconfigured." }, { status: 501 });
    }

    // Use collectionId from agent.config if present, else error
    const tool = new TribeSocialContentTool();
    const collectionId = agent.config?.collectionId;
    if (!collectionId) {
      return NextResponse.json({ error: "No collectionId configured for this agent." }, { status: 400 });
    }
    // Pass sessionToken to the tool for user-specific auth
    const schema = await tool.listContentAsComponentSchema(collectionId, undefined, sessionToken);
    console.log("[API] Returning ComponentSchema:", schema);

    return NextResponse.json(schema);
  } catch (error) {
    console.error("[API] Error in /api/agent/content:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Optionally, get platformId from query string
  const { searchParams } = new URL(req.url);
  const platformId = parseInt(searchParams.get("platformId") || "1", 10);
  const tool = new TribeSocialContentTool();
  const schema = await tool.listContentAsComponentSchema(platformId);
  return new Response(JSON.stringify(schema), { status: 200 });
}