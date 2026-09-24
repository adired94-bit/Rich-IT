"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Mic, Square, RotateCcw, Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Waveform } from "./waveform";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { formatDuration } from "@/lib/format-duration";
import { cn } from "@/lib/utils";
import type { VoiceProcessResponse } from "./types";

export function AudioRecorderPanel({
  clientId,
  onExtracted,
}: {
  clientId?: string;
  onExtracted: (data: VoiceProcessResponse) => void;
}) {
  const t = useTranslations("voice");
  const { state, elapsedMs, levels, audioBlob, audioUrl, errorKey, start, stop, reset } = useAudioRecorder();
  const [processing, setProcessing] = React.useState(false);
  const [processingStage, setProcessingStage] = React.useState<"transcribing" | "analyzing">("transcribing");

  async function handleProcess() {
    if (!audioBlob) return;
    setProcessing(true);
    setProcessingStage("transcribing");
    const stageTimer = setTimeout(() => setProcessingStage("analyzing"), 3500);

    try {
      const form = new FormData();
      const ext = audioBlob.type.includes("mp4") ? "m4a" : audioBlob.type.includes("ogg") ? "ogg" : "webm";
      form.append("audio", audioBlob, `recording.${ext}`);
      form.append("durationSeconds", String(Math.round(elapsedMs / 1000)));
      if (clientId) form.append("clientId", clientId);

      const res = await fetch("/api/ai/process-voice", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "ai_not_configured") toast.error(t("aiNotConfigured"));
        else toast.error(t("failed"));
        return;
      }
      onExtracted(data as VoiceProcessResponse);
    } catch (err) {
      console.error(err);
      toast.error(t("failed"));
    } finally {
      clearTimeout(stageTimer);
      setProcessing(false);
    }
  }

  if (processing) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-voice-soft">
          <Loader2 className="h-7 w-7 animate-spin text-voice" />
        </div>
        <p className="text-sm font-medium text-foreground">{t(processingStage)}</p>
        <p className="text-xs text-muted-foreground">{t("processing")}</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <AlertTriangle className="h-8 w-8 text-warning" />
        <p className="text-sm text-muted-foreground">{errorKey === "denied" ? t("micDenied") : t("unsupported")}</p>
        <Button variant="outline" onClick={reset}>{t("retry")}</Button>
      </div>
    );
  }

  if (state === "stopped" && audioUrl) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <audio src={audioUrl} controls className="w-full" />
        <p className="text-xs text-muted-foreground">{t("duration")}: {formatDuration(elapsedMs)}</p>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5" onClick={reset}>
            <RotateCcw className="h-4 w-4" /> {t("discard")}
          </Button>
          <Button variant="voice" className="gap-1.5" onClick={handleProcess}>
            <Sparkles className="h-4 w-4" /> {t("useRecording")}
          </Button>
        </div>
      </div>
    );
  }

  if (state === "recording") {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <Waveform levels={levels} active className="w-full max-w-sm" />
        <p className="text-2xl font-bold text-voice text-telemetry">{formatDuration(elapsedMs)}</p>
        <Button variant="destructive" size="lg" className="gap-2 rounded-full px-8" onClick={stop}>
          <Square className="h-4 w-4 fill-current" /> {t("stop")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <button
        type="button"
        onClick={start}
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-full bg-voice text-white shadow-glow-voice transition-transform hover:scale-105 cursor-pointer",
        )}
        aria-label={t("record")}
      >
        <Mic className="h-8 w-8" />
      </button>
      <p className="max-w-xs text-xs text-muted-foreground">{t("hint")}</p>
    </div>
  );
}
