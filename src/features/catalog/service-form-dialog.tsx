"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upsertServiceAction } from "@/server/actions/catalog";
import { serviceCategories, billingTypes } from "@/lib/validators/catalog";
import type { Service } from "@/db/schema";

const UNIT_KEYS = ["hour", "unit", "month", "project", "point", "meter", "device", "user"];

export function ServiceFormDialog({
  open,
  onOpenChange,
  service,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
}) {
  const t = useTranslations("catalog");
  const tApp = useTranslations("app");
  const [saving, setSaving] = React.useState(false);
  const isEdit = Boolean(service);

  const [form, setForm] = React.useState(() => toFormState(service));

  React.useEffect(() => {
    if (open) setForm(toFormState(service));
  }, [open, service]);

  function toFormState(s?: Service | null) {
    return {
      category: s?.category ?? "managed_it",
      sku: s?.sku ?? "",
      titleHe: s?.titleHe ?? "",
      titleRu: s?.titleRu ?? "",
      descriptionHe: s?.descriptionHe ?? "",
      descriptionRu: s?.descriptionRu ?? "",
      keywords: (s?.keywords ?? []).join(", "),
      defaultPrice: s?.defaultPrice ?? 0,
      billingType: s?.billingType ?? "hourly",
      unit: s?.unit ?? "hour",
      markupPercent: s?.markupPercent ?? 0,
      includedHours: s?.includedHours ?? 0,
      active: s?.active ?? true,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertServiceAction({
        id: service?.id,
        ...form,
        keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      });
      toast.success(tApp("saved"));
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(tApp("error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("edit") : t("new")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>{t("titleHe")}</Label>
              <Input value={form.titleHe} onChange={(e) => setForm((f) => ({ ...f, titleHe: e.target.value }))} dir="rtl" required />
            </div>
            <div>
              <Label>{t("titleRu")}</Label>
              <Input value={form.titleRu} onChange={(e) => setForm((f) => ({ ...f, titleRu: e.target.value }))} dir="ltr" required />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>{t("descriptionHe")}</Label>
              <Textarea value={form.descriptionHe} onChange={(e) => setForm((f) => ({ ...f, descriptionHe: e.target.value }))} dir="rtl" rows={2} />
            </div>
            <div>
              <Label>{t("descriptionRu")}</Label>
              <Textarea value={form.descriptionRu} onChange={(e) => setForm((f) => ({ ...f, descriptionRu: e.target.value }))} dir="ltr" rows={2} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <Label>{t("category")}</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as typeof f.category }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {serviceCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`categories.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("billingType")}</Label>
              <Select value={form.billingType} onValueChange={(v) => setForm((f) => ({ ...f, billingType: v as typeof f.billingType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {billingTypes.map((b) => (
                    <SelectItem key={b} value={b}>
                      {t(`billingTypes.${b}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("price")}</Label>
              <Input type="number" min={0} step="0.01" value={form.defaultPrice} onChange={(e) => setForm((f) => ({ ...f, defaultPrice: Number(e.target.value) }))} required />
            </div>
            <div>
              <Label>{t("unit")}</Label>
              <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIT_KEYS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {t(`units.${u}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.billingType === "hardware_markup" && (
            <div className="sm:w-1/2">
              <Label>{t("markup")}</Label>
              <Input type="number" min={0} max={500} value={form.markupPercent} onChange={(e) => setForm((f) => ({ ...f, markupPercent: Number(e.target.value) }))} />
            </div>
          )}
          {form.billingType === "retainer" && (
            <div className="sm:w-1/2">
              <Label>{t("includedHours")}</Label>
              <Input type="number" min={0} value={form.includedHours} onChange={(e) => setForm((f) => ({ ...f, includedHours: Number(e.target.value) }))} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>{t("sku")}</Label>
              <Input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} dir="ltr" />
            </div>
            <div className="flex items-end justify-between rounded-lg border border-border px-3 py-2">
              <Label className="mb-0">{t("active")}</Label>
              <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
            </div>
          </div>

          <div>
            <Label>{t("keywords")}</Label>
            <Textarea value={form.keywords} onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))} rows={2} dir="ltr" placeholder="cisco, מתג, коммутатор" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tApp("cancel")}
            </Button>
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
