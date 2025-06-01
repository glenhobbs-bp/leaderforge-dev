import http from 'http';
import 'dotenv/config';
import { Anthropic } from '@anthropic-ai/sdk';
import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { AIMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";

// TODO: Import and initialize your LangGraph agent here

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const PORT = process.env.PORT || 4000;

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/agent') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      // TODO: Wire up LangGraph agent logic here using CopilotKit request format
      // For now, just echo the request body and a Claude placeholder
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'LangGraph agent operational',
        request: JSON.parse(body),
        llm: 'Anthropic Claude (placeholder)'
      }));
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('LangGraph agent is running!\n');
  }
});

server.listen(PORT, () => {
  console.log(`LangGraph agent server listening on port ${PORT}`);
});

// Helper to coerce plain objects to LangChain message instances
function coerceMessages(messages: any[]): BaseMessage[] {
  return (messages || []).map((msg) => {
    if (msg.type === "TextMessage" && msg.role === "user") {
      return new HumanMessage(msg.content);
    }
    if (msg.type === "TextMessage" && msg.role === "assistant") {
      return new AIMessage(msg.content);
    }
    return msg;
  });
}

const AgentStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>(),
});

type AgentState = typeof AgentStateAnnotation.State;

function toClaudeMessages(messages: BaseMessage[]): { role: "user" | "assistant"; content: string }[] {
  return messages.map((msg) => {
    let content: string = "";
    if (msg._getType() === "human") {
      const raw = (msg as HumanMessage).content;
      if (typeof raw === "string") {
        content = raw;
      } else if (Array.isArray(raw)) {
        // Only join text blocks
        content = raw
          .map((b) => {
            if (typeof b === "string") return b;
            if (typeof b === "object" && b !== null && b.type === "text" && typeof b.text === "string") return b.text;
            return "";
          })
          .join(" ");
      } else {
        content = String(raw);
      }
      return { role: "user", content };
    }
    if (msg._getType() === "ai") {
      const raw = (msg as AIMessage).content;
      if (typeof raw === "string") {
        content = raw;
      } else if (Array.isArray(raw)) {
        content = raw
          .map((b) => {
            if (typeof b === "string") return b;
            if (typeof b === "object" && b !== null && b.type === "text" && typeof b.text === "string") return b.text;
            return "";
          })
          .join(" ");
      } else {
        content = String(raw);
      }
      return { role: "assistant", content };
    }
    throw new Error("Unsupported message type for Claude");
  });
}

const graph = new StateGraph(AgentStateAnnotation)
  .addNode("hello", async (state: AgentState) => {
    const coerced = coerceMessages(state.messages);
    const claudeMessages = toClaudeMessages(coerced);
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 256,
      messages: claudeMessages,
    });
    const text = Array.isArray(response.content) && response.content[0]?.type === "text"
      ? response.content[0].text
      : "[No response]";
    return {
      ...state,
      messages: [
        ...coerced,
        new AIMessage(text),
      ],
    };
  })
  .addEdge(START, "hello")
  .addEdge("hello", END)
  .compile();

export default graph;