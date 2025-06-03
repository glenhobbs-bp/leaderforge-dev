import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { TribeSocialContentTool } from "../../../../../../packages/agent-core/tools/TribeSocialContentTool";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { navOptionId } = await req.json();
  console.log("[API] Received navOptionId:", navOptionId);

  // Lookup nav option and agent (use correct schema API)
  const { data: navOption, error: navError } = await supabase
    .schema("core")
    .from("nav_options")
    .select("agent_id")
    .eq("id", navOptionId)
    .single();
  console.log("[API] navOption lookup result:", navOption, navError);

  if (navError || !navOption?.agent_id) {
    console.error("[API] No agent configured for this nav option.", navError);
    return new Response(
      JSON.stringify({ error: "No agent configured for this nav option." }),
      { status: 501 }
    );
  }

  // Lookup agent config (use correct schema API)
  const { data: agent, error: agentError } = await supabase
    .schema("core")
    .from("agents")
    .select("*")
    .eq("id", navOption.agent_id)
    .single();
  console.log("[API] agent lookup result:", agent, agentError);

  if (agentError || !agent) {
    console.error("[API] Agent not found or misconfigured.", agentError);
    return new Response(
      JSON.stringify({ error: "Agent not found or misconfigured." }),
      { status: 501 }
    );
  }

  // --- Agent invocation: use TribeSocialContentTool to return a ComponentSchema ---
  // In production, you would use agent config to select the right tool(s)
  // For now, always use the mock tool and platformId = 1
  const tool = new TribeSocialContentTool();
  const schema = await tool.listContentAsComponentSchema(1);
  console.log("[API] Returning ComponentSchema:", schema);

  return new Response(JSON.stringify(schema), { status: 200 });
}