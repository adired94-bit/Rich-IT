import { NextResponse } from "next/server";
import { getOpenAiClient } from "@/lib/ai/openai";
import { getAnthropicClient } from "@/lib/ai/anthropic";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { aiExtractionSchema } from "@/lib/validators/work-orders";
import { buildVoiceExtractionSystemPrompt, buildVoiceExtractionUserMessage, toCatalogPromptItem } from "@/lib/ai/prompt";
import { listActiveServices } from "@/server/queries/catalog";
import { listClientsBasic, getClient } from "@/server/queries/clients";
import { getAiSettings } from "@/server/queries/settings";
import { db } from "@/db";
import { voiceLogs } from "@/db/schema";
import { createServiceClient } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 120;

async function uploadAudio(file: File, clientId?: string | null): Promise<string | null> {
  try {
    const supabase = createServiceClient();
    const ext = file.type.includes("mp4") ? "m4a" : file.type.includes("ogg") ? "ogg" : "webm";
    const path = `${clientId ?? "unassigned"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage.from("audio").upload(path, buffer, { contentType: file.type || "audio/webm" });
    if (error) throw error;
    const { data } = await supabase.storage.from("audio").createSignedUrl(path, 60 * 60 * 24 * 30);
    return data?.signedUrl ?? null;
  } catch (err) {
    console.warn("[process-voice] audio upload skipped:", (err as Error).message);
    return null;
  }
}

export async function POST(request: Request) {
  const aiSettings = await getAiSettings();
  if (!aiSettings.openaiApiKey || !aiSettings.anthropicApiKey) {
    return NextResponse.json({ error: "ai_not_configured" }, { status: 501 });
  }

  const form = await request.formData();
  const audio = form.get("audio");
  const clientId = (form.get("clientId") as string | null) || null;
  const durationSecondsRaw = form.get("durationSeconds") as string | null;
  const durationSeconds = durationSecondsRaw ? Math.round(Number(durationSecondsRaw)) : null;

  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: "missing_audio" }, { status: 400 });
  }

  let voiceLogId: string | null = null;

  try {
    const [audioUrl, lockedClient, catalogRows, clientRows] = await Promise.all([
      uploadAudio(audio, clientId),
      clientId ? getClient(clientId) : Promise.resolve(null),
      listActiveServices(),
      clientId ? Promise.resolve([]) : listClientsBasic(),
    ]);

    const [{ id: logId }] = await db
      .insert(voiceLogs)
      .values({ clientId, audioUrl, durationSeconds, status: "processing" })
      .returning({ id: voiceLogs.id });
    voiceLogId = logId;

    // 1. Transcribe (Whisper auto-detects Hebrew / Russian / mixed speech).
    const openai = getOpenAiClient(aiSettings.openaiApiKey);
    let transcript = "";
    let whisperLanguage: string | null = null;
    try {
      const result = await openai.audio.transcriptions.create({
        file: audio,
        model: aiSettings.whisperModel,
        response_format: "verbose_json",
      });
      transcript = result.text;
      whisperLanguage = (result as { language?: string }).language ?? null;
    } catch {
      const result = await openai.audio.transcriptions.create({ file: audio, model: aiSettings.whisperModel });
      transcript = typeof result === "string" ? result : result.text;
    }

    if (!transcript.trim()) {
      await db.update(voiceLogs).set({ status: "failed", error: "empty_transcript" }).where(eq(voiceLogs.id, logId));
      return NextResponse.json({ error: "empty_transcript" }, { status: 422 });
    }

    // 2. Structured extraction against the service catalog + client list.
    const anthropic = getAnthropicClient(aiSettings.anthropicApiKey);
    const catalog = catalogRows.map(toCatalogPromptItem);
    const clients = clientId && lockedClient ? [{ id: lockedClient.id, name: lockedClient.name }] : clientRows;

    const response = await anthropic.messages.parse({
      model: aiSettings.claudeModel,
      max_tokens: 8000,
      output_config: { effort: "high", format: zodOutputFormat(aiExtractionSchema) },
      system: buildVoiceExtractionSystemPrompt(),
      messages: [
        {
          role: "user",
          content: buildVoiceExtractionUserMessage({
            transcript,
            catalog,
            clients,
            lockedClientName: lockedClient?.name ?? null,
          }),
        },
      ],
    });

    if (!response.parsed_output) {
      await db.update(voiceLogs).set({ status: "failed", error: "ai_parse_failed", transcript }).where(eq(voiceLogs.id, logId));
      return NextResponse.json({ error: "ai_parse_failed", transcript }, { status: 502 });
    }

    const extraction = response.parsed_output;
    const finalClientId = clientId ?? extraction.clientMatchId ?? null;

    const catalogById = new Map(catalogRows.map((s) => [s.id, s]));
    const enrichedItems = extraction.items.map((item) => {
      const service = item.serviceId ? catalogById.get(item.serviceId) : undefined;
      return { ...item, serviceId: service ? service.id : null, matchedServiceTitleHe: service?.titleHe ?? null };
    });

    await db
      .update(voiceLogs)
      .set({
        status: "done",
        transcript,
        languageDetected: extraction.detectedLanguage || whisperLanguage,
        clientId: finalClientId,
        aiResult: extraction,
      })
      .where(eq(voiceLogs.id, logId));

    return NextResponse.json({
      voiceLogId: logId,
      transcript,
      detectedLanguage: extraction.detectedLanguage,
      clientId: finalClientId,
      clientName: lockedClient?.name ?? extraction.clientNameMentioned ?? null,
      extraction: { ...extraction, items: enrichedItems },
    });
  } catch (err) {
    console.error("[process-voice] failed:", err);
    if (voiceLogId) {
      await db
        .update(voiceLogs)
        .set({ status: "failed", error: (err as Error).message?.slice(0, 500) })
        .where(eq(voiceLogs.id, voiceLogId))
        .catch(() => {});
    }
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
