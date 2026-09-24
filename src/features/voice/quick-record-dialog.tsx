"use client";
import { useUiStore } from "@/stores/ui-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { AudioRecorderPanel } from "./audio-recorder-panel";

/** Global quick-record entry point, mounted once in the app shell. Opened via useUiStore.openQuickRecord(). */
export function QuickRecordDialog() {
  const open = useUiStore((s) => s.quickRecordOpen);
  const clientId = useUiStore((s) => s.quickRecordClientId);
  const close = useUiStore((s) => s.closeQuickRecord);
  const t = useTranslations("voice");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("quickRecordTitle")}</DialogTitle>
          <DialogDescription>{t("hint")}</DialogDescription>
        </DialogHeader>
        {open && <AudioRecorderPanel clientId={clientId ?? undefined} onDone={close} />}
      </DialogContent>
    </Dialog>
  );
}
