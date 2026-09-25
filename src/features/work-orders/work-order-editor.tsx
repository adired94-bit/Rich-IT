"use client";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ItemEditor } from "./item-editor";
import { CatalogPickerDialog } from "./catalog-picker-dialog";
import { fetchClientsBasicAction, fetchActiveRetainersAction } from "@/server/actions/clients";
import { fetchActiveServicesAction } from "@/server/actions/catalog";
import { upsertWorkOrderAction } from "@/server/actions/work-orders";
import { computeTotals, documentLanguages, type WorkOrderItemValues } from "@/lib/validators/work-orders";
import { formatMoney, toInputDateTime, formatNumber } from "@/lib/utils";
import type { CompanySettings } from "@/server/queries/settings";
import type { VoiceProcessResponse } from "@/features/voice/types";
import type { Locale } from "@/i18n/config";
import type { getWorkOrder } from "@/server/queries/work-orders";

type ExistingWorkOrder = NonNullable<Awaited<ReturnType<typeof getWorkOrder>>>;

interface FormState {
  clientId: string;
  date: string;
  title: string;
  summary: string;
  nextSteps: string;
  internalNotes: string;
  language: (typeof documentLanguages)[number];
  performerName: string;
  timeSpentMinutes: number;
  discount: number;
  vatRate: number;
  items: WorkOrderItemValues[];
  retainerId: string;
  retainerHours: number;
}

function blankForm(company: CompanySettings, clientId?: string): FormState {
  return {
    clientId: clientId ?? "",
    date: toInputDateTime(new Date()),
    title: "",
    summary: "",
    nextSteps: "",
    internalNotes: "",
    language: "he",
    performerName: company.engineerName,
    timeSpentMinutes: 0,
    discount: 0,
    vatRate: company.defaultVatRate,
    items: [],
    retainerId: "",
    retainerHours: 0,
  };
}

function fromExisting(wo: ExistingWorkOrder, company: CompanySettings): FormState {
  return {
    clientId: wo.clientId,
    date: toInputDateTime(wo.date),
    title: wo.title,
    summary: wo.summary ?? "",
    nextSteps: wo.nextSteps ?? "",
    internalNotes: wo.internalNotes ?? "",
    language: wo.language,
    performerName: wo.performerName ?? company.engineerName,
    timeSpentMinutes: wo.timeSpentMinutes,
    discount: wo.discount,
    vatRate: wo.vatRate,
    items: wo.items.map((it) => ({
      id: it.id,
      serviceId: it.serviceId,
      itemType: it.itemType,
      description: it.description,
      descriptionRu: it.descriptionRu ?? "",
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: it.unitPrice,
      discount: it.discount,
    })),
    retainerId: "",
    retainerHours: 0,
  };
}

function fromAi(data: VoiceProcessResponse, company: CompanySettings): FormState {
  const base = blankForm(company, data.clientId ?? undefined);
  return {
    ...base,
    title: data.extraction.title,
    summary: data.extraction.summaryHe,
    nextSteps: data.extraction.nextSteps ?? "",
    language: data.detectedLanguage === "ru" ? "ru" : data.detectedLanguage === "mixed" ? "dual" : "he",
    timeSpentMinutes: data.extraction.timeSpentMinutes,
    items: data.extraction.items.map((it) => ({
      serviceId: it.serviceId,
      itemType: it.itemType,
      description: it.description,
      descriptionRu: it.descriptionRu,
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: it.unitPrice,
      discount: it.discount,
    })),
  };
}

export function WorkOrderEditor({
  workOrder,
  aiData,
  defaultClientId,
  company,
  onSaved,
  onCancel,
}: {
  workOrder?: ExistingWorkOrder;
  aiData?: VoiceProcessResponse;
  defaultClientId?: string;
  company: CompanySettings;
  onSaved: (id: string) => void;
  onCancel?: () => void;
}) {
  const t = useTranslations("workOrders");
  const tApp = useTranslations("app");
  const tRetainers = useTranslations("clients.retainers");
  const locale = useLocale() as Locale;

  const [form, setForm] = React.useState<FormState>(() =>
    workOrder ? fromExisting(workOrder, company) : aiData ? fromAi(aiData, company) : blankForm(company, defaultClientId),
  );
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const { data: clients = [] } = useQuery({ queryKey: ["clients-basic"], queryFn: fetchClientsBasicAction, staleTime: 60_000 });
  const { data: services = [] } = useQuery({ queryKey: ["services-active"], queryFn: fetchActiveServicesAction, staleTime: 60_000 });
  const { data: retainers = [] } = useQuery({
    queryKey: ["retainers-active", form.clientId],
    queryFn: () => fetchActiveRetainersAction(form.clientId),
    enabled: Boolean(form.clientId),
  });

  const totals = React.useMemo(() => computeTotals(form.items, form.discount, form.vatRate), [form.items, form.discount, form.vatRate]);
  const selectedRetainer = retainers.find((r) => r.id === form.retainerId);

  function patch(p: Partial<FormState>) {
    setForm((f) => ({ ...f, ...p }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId) {
      toast.error(t("noClientDetected"));
      return;
    }
    if (form.items.length === 0) {
      toast.error(tApp("required"));
      return;
    }
    setSaving(true);
    try {
      const res = await upsertWorkOrderAction({
        id: workOrder?.id,
        clientId: form.clientId,
        date: new Date(form.date).toISOString(),
        title: form.title,
        summary: form.summary,
        nextSteps: form.nextSteps,
        internalNotes: form.internalNotes,
        language: form.language,
        performerName: form.performerName,
        timeSpentMinutes: form.timeSpentMinutes,
        discount: form.discount,
        vatRate: form.vatRate,
        items: form.items,
        retainerId: form.retainerId || null,
        retainerHours: form.retainerHours || null,
        transcript: aiData?.transcript,
        aiResult: aiData?.extraction as unknown as Record<string, unknown>,
      });
      toast.success(tApp("saved"));
      onSaved(res.id);
    } catch (err) {
      console.error(err);
      toast.error(tApp("error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {aiData && (
        <Card className="border-voice/30 bg-voice-soft">
          <CardContent className="flex flex-col gap-2 pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-voice">
                <Sparkles className="h-4 w-4" /> {t("aiDraft")}
              </span>
              <Badge variant="voice">{t("confidence")}: {Math.round(aiData.extraction.confidence * 100)}%</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{t("reviewAi")}</p>
            {!form.clientId && (
              <p className="flex items-center gap-1.5 text-xs text-warning">
                <AlertCircle className="h-3.5 w-3.5" />
                {t("noClientDetected")}
                {aiData.clientName && <span> — &quot;{aiData.clientName}&quot;</span>}
              </p>
            )}
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer select-none">{t("transcript")}</summary>
              <p className="mt-1 whitespace-pre-wrap rounded-md bg-background/40 p-2">{aiData.transcript}</p>
            </details>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>{tApp("client")}</Label>
          <Select value={form.clientId} onValueChange={(v) => patch({ clientId: v, retainerId: "" })}>
            <SelectTrigger><SelectValue placeholder={tApp("client")} /></SelectTrigger>
            <SelectContent>
              {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t("titleField")}</Label>
          <Input value={form.title} onChange={(e) => patch({ title: e.target.value })} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <Label>{t("date")}</Label>
          <Input type="datetime-local" value={form.date} onChange={(e) => patch({ date: e.target.value })} required />
        </div>
        <div>
          <Label>{t("language")}</Label>
          <Select value={form.language} onValueChange={(v) => patch({ language: v as FormState["language"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="he">{tApp("hebrew")}</SelectItem>
              <SelectItem value="ru">{tApp("russian")}</SelectItem>
              <SelectItem value="dual">{tApp("dual")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t("performer")}</Label>
          <Input value={form.performerName} onChange={(e) => patch({ performerName: e.target.value })} />
        </div>
        <div>
          <Label>{t("timeSpent")} ({tApp("minutes")})</Label>
          <Input type="number" min={0} value={form.timeSpentMinutes} onChange={(e) => patch({ timeSpentMinutes: Number(e.target.value) })} />
        </div>
      </div>

      <div>
        <Label>{t("items")}</Label>
        <ItemEditor items={form.items} onChange={(items) => patch({ items })} onAddCatalog={() => setPickerOpen(true)} />
      </div>

      {form.clientId && retainers.length > 0 && (
        <fieldset className="rounded-lg border border-border p-3">
          <legend className="px-1 text-xs font-medium text-muted-foreground">{t("retainerHours")}</legend>
          <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
            <Select value={form.retainerId || "none"} onValueChange={(v) => patch({ retainerId: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{tApp("none")}</SelectItem>
                {retainers.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.title} — {formatNumber(r.totalHours - r.usedHours, locale)} {tApp("hours")} {tRetainers("remaining")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.retainerId && (
              <Input
                type="number"
                min={0}
                step="0.25"
                value={form.retainerHours}
                onChange={(e) => patch({ retainerHours: Number(e.target.value) })}
                placeholder={t("retainerHours")}
              />
            )}
          </div>
          {selectedRetainer && form.retainerHours > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">{t("retainerDeduct", { hours: form.retainerHours })}</p>
          )}
        </fieldset>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>{t("summary")}</Label>
          <Textarea rows={4} value={form.summary} onChange={(e) => patch({ summary: e.target.value })} />
        </div>
        <div>
          <Label>{t("nextSteps")}</Label>
          <Textarea rows={4} value={form.nextSteps} onChange={(e) => patch({ nextSteps: e.target.value })} />
        </div>
      </div>
      <div>
        <Label>{t("internalNotes")}</Label>
        <Textarea rows={2} value={form.internalNotes} onChange={(e) => patch({ internalNotes: e.target.value })} />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 pt-5 text-sm sm:flex-row sm:items-end sm:justify-between">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
            <div>
              <Label>{tApp("discount")}</Label>
              <Input type="number" min={0} step="0.01" className="w-28" value={form.discount} onChange={(e) => patch({ discount: Number(e.target.value) })} />
            </div>
            <div>
              <Label>{t("vatRate")}</Label>
              <Input
                type="number"
                min={0}
                max={1}
                step="0.01"
                className="w-28"
                value={form.vatRate}
                onChange={(e) => patch({ vatRate: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="space-y-0.5 text-end">
            <p className="text-xs text-muted-foreground">{tApp("subtotal")}: {formatMoney(totals.subtotal, locale)}</p>
            <p className="text-xs text-muted-foreground">{tApp("vat")}: {formatMoney(totals.vatAmount, locale)}</p>
            <p className="text-lg font-bold text-primary text-telemetry">{t("total")}: {formatMoney(totals.totalAmount, locale)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>{tApp("cancel")}</Button>}
        <Button type="submit" disabled={saving} className="gap-1.5">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {workOrder ? tApp("save") : t("createDocument")}
        </Button>
      </div>

      <CatalogPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        services={services}
        onPick={(s) =>
          patch({
            items: [
              ...form.items,
              {
                serviceId: s.id,
                itemType: s.billingType === "hardware_markup" ? "hardware" : "service",
                description: s.titleHe,
                descriptionRu: s.titleRu,
                quantity: 1,
                unit: s.unit,
                unitPrice: s.defaultPrice,
                discount: 0,
              },
            ],
          })
        }
      />
    </form>
  );
}
