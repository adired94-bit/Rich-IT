"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useUiStore } from "@/stores/ui-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AudioRecorderPanel } from "./audio-recorder-panel";
import { WorkOrderEditor } from "@/features/work-orders/work-order-editor";
import type { VoiceProcessResponse } from "./types";

/** Global quick-record entry point, mounted once in the app shell. Opened via useUiStore.openQuickRecord(). */
export function QuickRecordDialog() {
  const open = useUiStore((s) => s.quickRecordOpen);
  const clientId = useUiStore((s) => s.quickRecordClientId);
  const close = useUiStore((s) => s.closeQuickRecord);
  const t = useTranslations("voice");
  const tWo = useTranslations("workOrders");
  const router = useRouter();
  const [extracted, setExtracted] = React.useState<VoiceProcessResponse | null>(null);

  function handleClose(next: boolean) {
    if (!next) {
      close();
      setExtracted(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={extracted ? "max-w-3xl" : "max-w-xl"}>
        <DialogHeader>
          <DialogTitle>{t("quickRecordTitle")}</DialogTitle>
          <DialogDescription>{extracted ? tWo("reviewAi") : t("hint")}</DialogDescription>
        </DialogHeader>
        {open && !extracted && (
          <AudioRecorderPanel clientId={clientId ?? undefined} onExtracted={setExtracted} />
        )}
        {open && extracted && (
          <WorkOrderEditor
            aiData={extracted}
            onSaved={(id) => {
              handleClose(false);
              router.push(`/work-orders/${id}`);
            }}
            onCancel={() => setExtracted(null)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
