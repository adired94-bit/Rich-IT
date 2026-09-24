"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Eye, EyeOff, Copy, Lock, Server, Wifi, Cloud, Router, KeyRound, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VaultFormDialog } from "../vault-form-dialog";
import { deleteVaultEntryAction, revealVaultEntryAction } from "@/server/actions/clients";
import { formatDateTime } from "@/lib/utils";
import type { VaultPayload } from "@/lib/validators/clients";
import type { VaultEntry } from "@/db/schema";

const iconByCategory: Record<string, React.ElementType> = {
  server: Server,
  network: Router,
  wifi: Wifi,
  cloud: Cloud,
  credentials: KeyRound,
  note: StickyNote,
};

export function VaultTab({ clientId, entries }: { clientId: string; entries: VaultEntry[] }) {
  const t = useTranslations("clients.vault");
  const tApp = useTranslations("app");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<VaultEntry | null>(null);
  const [deleting, setDeleting] = React.useState<VaultEntry | null>(null);
  const [revealed, setRevealed] = React.useState<Record<string, VaultPayload>>({});
  const [revealing, setRevealing] = React.useState<string | null>(null);

  async function toggleReveal(entry: VaultEntry) {
    if (revealed[entry.id]) {
      setRevealed((r) => {
        const next = { ...r };
        delete next[entry.id];
        return next;
      });
      return;
    }
    setRevealing(entry.id);
    try {
      const payload = await revealVaultEntryAction(entry.id);
      setRevealed((r) => ({ ...r, [entry.id]: payload }));
    } catch {
      toast.error(t("keyMissing"));
    } finally {
      setRevealing(null);
    }
  }

  async function copyValue(value?: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast.success(tApp("copied"));
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteVaultEntryAction(deleting.id, clientId);
      toast.success(tApp("deleted"));
    } catch {
      toast.error(tApp("error"));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> {t("subtitle")}
        </p>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> {t("add")}
        </Button>
      </div>

      {entries.length === 0 ? (
        <EmptyState icon={Lock} title={t("empty")} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {entries.map((entry) => {
            const Icon = iconByCategory[entry.category] ?? KeyRound;
            const payload = revealed[entry.id];
            return (
              <Card key={entry.id} className="space-y-2 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                      <Badge variant="outline" className="mt-0.5">{t(`categories.${entry.category}`)}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(entry); setFormOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(entry)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-2.5 text-xs" dir="ltr">
                  {(["host", "username", "password", "url"] as const).map((field) =>
                    payload?.[field] || !payload ? (
                      <div key={field} className="flex items-center justify-between gap-2">
                        <span className="w-16 shrink-0 text-muted-foreground">{t(field)}</span>
                        <span className="flex-1 truncate font-mono text-foreground">
                          {payload ? payload[field] || "—" : "••••••••"}
                        </span>
                        {payload?.[field] && (
                          <button
                            type="button"
                            onClick={() => copyValue(payload[field])}
                            className="shrink-0 text-muted-foreground hover:text-primary cursor-pointer"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ) : null,
                  )}
                  {payload?.notes && <p className="whitespace-pre-wrap border-t border-border pt-1.5 text-muted-foreground">{payload.notes}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{formatDateTime(entry.updatedAt, "he")}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    disabled={revealing === entry.id}
                    onClick={() => toggleReveal(entry)}
                  >
                    {payload ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {payload ? t("hide") : t("reveal")}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <VaultFormDialog open={formOpen} onOpenChange={setFormOpen} clientId={clientId} entry={editing} />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tApp("confirm")}</AlertDialogTitle>
            <AlertDialogDescription>{tApp("confirmDelete")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tApp("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{tApp("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
