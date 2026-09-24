"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upsertClientAction } from "@/server/actions/clients";
import { slaLevels, clientStatuses, documentLanguages } from "@/lib/validators/clients";
import type { Client } from "@/db/schema";

export function ClientForm({
  client,
  onSuccess,
  submitLabel,
}: {
  client?: Client | null;
  onSuccess: (id: string) => void;
  submitLabel?: string;
}) {
  const t = useTranslations("clients");
  const tApp = useTranslations("app");
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState(() => ({
    name: client?.name ?? "",
    contactPerson: client?.contactPerson ?? "",
    phone: client?.phone ?? "",
    email: client?.email ?? "",
    address: client?.address ?? "",
    notes: client?.notes ?? "",
    slaLevel: client?.slaLevel ?? "none",
    status: client?.status ?? "active",
    preferredLanguage: client?.preferredLanguage ?? "he",
    hourlyRate: client?.hourlyRate ?? undefined,
    vatId: client?.billingInfo?.vatId ?? "",
    billingEmail: client?.billingInfo?.billingEmail ?? "",
    paymentTerms: client?.billingInfo?.paymentTerms ?? "",
    tags: (client?.tags ?? []).join(", "),
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await upsertClientAction({
        id: client?.id,
        ...form,
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      });
      toast.success(tApp("saved"));
      onSuccess(res.id);
    } catch (err) {
      console.error(err);
      toast.error(tApp("error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>{t("name")}</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        </div>
        <div>
          <Label>{t("contactPerson")}</Label>
          <Input value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} />
        </div>
        <div>
          <Label>{t("phone")}</Label>
          <Input dir="ltr" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
        <div>
          <Label>{t("email")}</Label>
          <Input dir="ltr" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <Label>{t("address")}</Label>
          <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <Label>{t("sla")}</Label>
          <Select value={form.slaLevel} onValueChange={(v) => setForm((f) => ({ ...f, slaLevel: v as typeof f.slaLevel }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {slaLevels.map((s) => <SelectItem key={s} value={s}>{t(`slaLevels.${s}`)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t("status")}</Label>
          <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as typeof f.status }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {clientStatuses.map((s) => <SelectItem key={s} value={s}>{t(`statuses.${s}`)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t("preferredLanguage")}</Label>
          <Select value={form.preferredLanguage} onValueChange={(v) => setForm((f) => ({ ...f, preferredLanguage: v as typeof f.preferredLanguage }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {documentLanguages.map((l) => <SelectItem key={l} value={l}>{tApp(l === "he" ? "hebrew" : l === "ru" ? "russian" : "dual")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>{t("hourlyRate")}</Label>
          <Input type="number" min={0} step="0.01" value={form.hourlyRate ?? ""} onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value ? Number(e.target.value) : undefined }))} />
        </div>
        <div>
          <Label>{t("tags")}</Label>
          <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="VIP, שרת, ענן" />
        </div>
      </div>

      <fieldset className="rounded-lg border border-border p-3">
        <legend className="px-1 text-xs font-medium text-muted-foreground">{t("billing")}</legend>
        <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-3">
          <div>
            <Label>{t("vatId")}</Label>
            <Input dir="ltr" value={form.vatId} onChange={(e) => setForm((f) => ({ ...f, vatId: e.target.value }))} />
          </div>
          <div>
            <Label>{t("billingEmail")}</Label>
            <Input dir="ltr" type="email" value={form.billingEmail} onChange={(e) => setForm((f) => ({ ...f, billingEmail: e.target.value }))} />
          </div>
          <div>
            <Label>{t("paymentTerms")}</Label>
            <Input value={form.paymentTerms} onChange={(e) => setForm((f) => ({ ...f, paymentTerms: e.target.value }))} />
          </div>
        </div>
      </fieldset>

      <div>
        <Label>{t("notes")}</Label>
        <Textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel ?? tApp("save")}
        </Button>
      </div>
    </form>
  );
}
