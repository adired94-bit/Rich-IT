"use client";
import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, PlusCircle, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { RetainerFormDialog } from "../retainer-form-dialog";
import { deleteRetainerAction, logRetainerUsageAction } from "@/server/actions/clients";
import { formatDate, formatMoney, formatNumber } from "@/lib/utils";
import type { listRetainers } from "@/server/queries/clients";
import type { Retainer } from "@/db/schema";
import type { Locale } from "@/i18n/config";

type RetainerRow = Awaited<ReturnType<typeof listRetainers>>[number];

export function RetainersTab({ clientId, retainers }: { clientId: string; retainers: RetainerRow[] }) {
  const t = useTranslations("clients.retainers");
  const tApp = useTranslations("app");
  const locale = useLocale() as Locale;
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Retainer | null>(null);
  const [deleting, setDeleting] = React.useState<Retainer | null>(null);
  const [logging, setLogging] = React.useState<RetainerRow | null>(null);
  const [usage, setUsage] = React.useState({ hours: 1, note: "" });
  const [saving, setSaving] = React.useState(false);

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteRetainerAction(deleting.id, clientId);
      toast.success(tApp("deleted"));
    } catch {
      toast.error(tApp("error"));
    } finally {
      setDeleting(null);
    }
  }

  async function handleLogUsage(e: React.FormEvent) {
    e.preventDefault();
    if (!logging) return;
    setSaving(true);
    try {
      await logRetainerUsageAction({ retainerId: logging.id, ...usage }, clientId);
      toast.success(tApp("saved"));
      setLogging(null);
      setUsage({ hours: 1, note: "" });
    } catch {
      toast.error(tApp("error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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

      {retainers.length === 0 ? (
        <EmptyState icon={Timer} title={t("empty")} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {retainers.map((r) => {
            const remaining = r.totalHours - r.usedHours;
            const pct = Math.min(100, Math.round((r.usedHours / r.totalHours) * 100));
            const exceeded = remaining < 0;
            return (
              <Card key={r.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(r.periodStart, locale)} – {formatDate(r.periodEnd, locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {r.active && <Badge variant="success">{t("active")}</Badge>}
                    <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(r); setFormOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(r)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t("usedHours")}: {formatNumber(r.usedHours, locale)} / {formatNumber(r.totalHours, locale)}</span>
                    <span className={exceeded ? "font-semibold text-destructive" : "font-semibold text-success"}>
                      {exceeded ? t("exceeded") : `${t("remaining")}: ${formatNumber(remaining, locale)}`}
                    </span>
                  </div>
                  <Progress value={pct} indicatorClassName={exceeded ? "bg-destructive" : undefined} />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
                  <span>{t("monthlyFee")}: <span className="font-semibold text-foreground">{formatMoney(r.monthlyFee, locale)}</span></span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => {
                      setLogging(r);
                      setUsage({ hours: 1, note: "" });
                    }}
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> {t("logUsage")}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <RetainerFormDialog open={formOpen} onOpenChange={setFormOpen} clientId={clientId} retainer={editing} />

      <Dialog open={Boolean(logging)} onOpenChange={(v) => !v && setLogging(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("logUsage")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogUsage} className="space-y-4">
            <div>
              <Label>{t("hours")}</Label>
              <Input type="number" min={0.1} step="0.1" value={usage.hours} onChange={(e) => setUsage((u) => ({ ...u, hours: Number(e.target.value) }))} required />
            </div>
            <div>
              <Label>{t("note")}</Label>
              <Textarea rows={2} value={usage.note} onChange={(e) => setUsage((u) => ({ ...u, note: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLogging(null)}>{tApp("cancel")}</Button>
              <Button type="submit" disabled={saving}>{tApp("save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
