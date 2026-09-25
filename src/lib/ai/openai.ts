import "server-only";
import OpenAI from "openai";

export function getOpenAiClient(apiKey: string): OpenAI {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}
