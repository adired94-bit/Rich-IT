import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export function getAnthropicClient(apiKey: string): Anthropic {
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  return new Anthropic({ apiKey });
}
