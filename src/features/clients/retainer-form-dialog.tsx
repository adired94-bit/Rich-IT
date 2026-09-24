"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { upsertRetainerAction } from "@/server/actions/clients";
import { toInputDate } from "@/lib/utils";
import type { Retainer } from "@/db/schema";

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function RetainerFormDialog({
  open,
  onOpenChange,
  clientId,
  retainer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  retainer?: Retainer | null;
}) {
  const t = useTranslations("clients.retainers");
  const tApp = useTranslations("app");
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState(() => ({
    title: retainer?.title ?? "",
    totalHours: retainer?.totalHours ?? 10,
    monthlyFee: retainer?.monthlyFee ?? 0,
    overageRate: retainer?.overageRate ?? 0,
    periodStart: toInputDate(retainer?.periodStart ?? startOfMonth()),
    periodEnd: toInputDate(retainer?.periodEnd ?? endOfMonth()),
    active: retainer?.active ?? true,
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertRetainerAction({ id: retainer?.id, clientId, ...form });
      toast.success(tApp("saved"));
      onOpenChange(false);
    } catch {
      toast.error(tApp("error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("add")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{tApp("title")}</Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("totalHours")}</Label>
              <Input type="number" min={0.5} step="0.5" value={form.totalHours} onChange={(e) => setForm((f) => ({ ...f, totalHours: Number(e.target.value) }))} required />
            </div>
            <div>
              <Label>{t("monthlyFee")}</Label>
              <Input type="number" min={0} step="0.01" value={form.monthlyFee} onChange={(e) => setForm((f) => ({ ...f, monthlyFee: Number(e.target.value) }))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("period")} — {tApp("date")}</Label>
              <Input type="date" value={form.periodStart} onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))} required />
            </div>
            <div>
              <Label>&nbsp;</Label>
              <Input type="date" value={form.periodEnd} onChange={(e) => setForm((f) => ({ ...f, periodEnd: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("overageRate")}</Label>
              <Input type="number" min={0} step="0.01" value={form.overageRate} onChange={(e) => setForm((f) => ({ ...f, overageRate: Number(e.target.value) }))} />
            </div>
            <div className="flex items-end justify-between rounded-lg border border-border px-3 py-2">
              <Label className="mb-0">{t("active")}</Label>
              <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{tApp("cancel")}</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {tApp("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
