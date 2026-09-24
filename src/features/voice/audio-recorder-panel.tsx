"use client";
import { useTranslations } from "next-intl";
import { Mic } from "lucide-react";

/** Placeholder — replaced with the full recorder + AI pipeline in the voice engine milestone. */
export function AudioRecorderPanel({ clientId, onDone }: { clientId?: string; onDone?: () => void }) {
  const t = useTranslations("voice");
  void clientId;
  void onDone;
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center text-muted-foreground">
      <Mic className="h-10 w-10 text-voice" />
      <p className="text-sm">{t("hint")}</p>
    </div>
  );
}
