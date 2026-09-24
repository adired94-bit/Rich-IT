"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upsertEventAction, deleteEventAction } from "@/server/actions/calendar";
import { eventStatuses, eventTypes } from "@/lib/validators/calendar";
import { toInputDateTime } from "@/lib/utils";
import type { CalendarEvent } from "@/db/schema";

interface ClientOption {
  id: string;
  name: string;
}

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  clients,
  defaultStart,
  defaultClientId,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  clients: ClientOption[];
  defaultStart?: Date;
  defaultClientId?: string | null;
  onChanged?: () => void;
}) {
  const t = useTranslations("calendar");
  const tApp = useTranslations("app");
  const [saving, setSaving] = React.useState(false);

  const buildDefaults = React.useCallback(() => {
    const start = event?.startTime ?? defaultStart ?? new Date();
    const end = event?.endTime ?? new Date(new Date(start).getTime() + 60 * 60 * 1000);
    return {
      clientId: event?.clientId ?? defaultClientId ?? "",
      title: event?.title ?? "",
      description: event?.description ?? "",
      location: event?.location ?? "",
      startTime: toInputDateTime(start),
      endTime: toInputDateTime(end),
      allDay: event?.allDay ?? false,
      status: event?.status ?? "scheduled",
      type: event?.type ?? "visit",
    };
  }, [event, defaultStart, defaultClientId]);

  const [form, setForm] = React.useState(buildDefaults);

  React.useEffect(() => {
    if (open) setForm(buildDefaults());
  }, [open, buildDefaults]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertEventAction({ id: event?.id, ...form, clientId: form.clientId || null });
      toast.success(tApp("saved"));
      onOpenChange(false);
      onChanged?.();
    } catch (err) {
      console.error(err);
      toast.error(tApp("error"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!event) return;
    try {
      await deleteEventAction(event.id, event.clientId);
      toast.success(tApp("deleted"));
      onOpenChange(false);
      onChanged?.();
    } catch {
      toast.error(tApp("error"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event ? t("edit") : t("new")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{tApp("title")}</Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>{tApp("client")}</Label>
              <Select value={form.clientId || "none"} onValueChange={(v) => setForm((f) => ({ ...f, clientId: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{tApp("none")}</SelectItem>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("type")}</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as typeof f.type }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {eventTypes.map((tp) => <SelectItem key={tp} value={tp}>{t(`types.${tp}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>{t("start")}</Label>
              <Input type="datetime-local" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} required />
            </div>
            <div>
              <Label>{t("end")}</Label>
              <Input type="datetime-local" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-end justify-between rounded-lg border border-border px-3 py-2">
              <Label className="mb-0">{t("allDay")}</Label>
              <Switch checked={form.allDay} onCheckedChange={(v) => setForm((f) => ({ ...f, allDay: v }))} />
            </div>
            <div>
              <Label>{t("status")}</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as typeof f.status }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {eventStatuses.map((s) => <SelectItem key={s} value={s}>{t(`statuses.${s}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>{t("location")}</Label>
            <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          </div>
          <div>
            <Label>{tApp("description")}</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>

          <DialogFooter className="sm:justify-between">
            {event ? (
              <Button type="button" variant="ghost" className="text-destructive gap-1.5" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" /> {tApp("delete")}
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{tApp("cancel")}</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {tApp("save")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
