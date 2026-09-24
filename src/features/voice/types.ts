import type { AiExtraction } from "@/lib/validators/work-orders";

export interface VoiceProcessResponse {
  voiceLogId: string;
  transcript: string;
  detectedLanguage: AiExtraction["detectedLanguage"];
  clientId: string | null;
  clientName: string | null;
  extraction: AiExtraction & {
    items: (AiExtraction["items"][number] & { matchedServiceTitleHe: string | null })[];
  };
}
