import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: anthropic("claude-3-5-sonnet-latest"), 
    messages,
    system: "You are a helpful assistant for rugby fans in Wales, providing information about teams, players, and matches. Answer questions concisely and accurately.",
  });

  return result.toTextStreamResponse();
}