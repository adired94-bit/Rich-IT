"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientForm } from "./client-form";
import type { Client } from "@/db/schema";

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSaved?: (id: string) => void;
}) {
  const t = useTranslations("clients");
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{client ? t("edit") : t("new")}</DialogTitle>
        </DialogHeader>
        <ClientForm
          client={client}
          onSuccess={(id) => {
            onOpenChange(false);
            if (onSaved) onSaved(id);
            else router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
