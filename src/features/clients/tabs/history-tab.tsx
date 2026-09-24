"use client";
import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Plus, Trash2, Phone, Video, Mail, MessageCircle, FileText, CalendarClock, Mic, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { addInteractionAction, deleteInteractionAction } from "@/server/actions/clients";
import { interactionTypes } from "@/lib/validators/clients";
import { formatDateTime } from "@/lib/utils";
import type { listInteractions } from "@/server/queries/clients";
import type { Locale } from "@/i18n/config";

const iconByType: Record<string, React.ElementType> = {
  note: StickyNote,
  call: Phone,
  visit: CalendarClock,
  remote: Video,
  email: Mail,
  whatsapp: MessageCircle,
  work_order: FileText,
  event: CalendarClock,
  voice_log: Mic,
};

export function HistoryTab({ clientId, interactions }: { clientId: string; interactions: Awaited<ReturnType<typeof listInteractions>> }) {
  const t = useTranslations("clients.history");
  const tApp = useTranslations("app");
  const locale = useLocale() as Locale;
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ type: "note" as (typeof interactionTypes)[number], title: "", body: "" });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await addInteractionAction({ clientId, ...form });
      toast.success(tApp("saved"));
      setOpen(false);
      setForm({ type: "note", title: "", body: "" });
    } catch {
      toast.error(tApp("error"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteInteractionAction(id, clientId);
      toast.success(tApp("deleted"));
    } catch {
      toast.error(tApp("error"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> {t("addNote")}
        </Button>
      </div>

      {interactions.length === 0 ? (
        <EmptyState icon={StickyNote} title={tApp("empty")} />
      ) : (
        <ol className="relative space-y-4 ps-5 before:absolute before:inset-y-0 before:start-[7px] before:w-px before:bg-border">
          {interactions.map((i) => {
            const Icon = iconByType[i.type] ?? StickyNote;
            return (
              <li key={i.id} className="relative">
                <span className="absolute -start-5 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary shadow-glow" />
                <Card className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{i.title}</p>
                        {i.body && <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{i.body}</p>}
                        <div className="mt-1.5 flex items-center gap-2">
                          <Badge variant="outline">{t(`types.${i.type}`)}</Badge>
                          <span className="text-[11px] text-muted-foreground">{formatDateTime(i.occurredAt, locale)}</span>
                        </div>
                      </div>
                    </div>
                    {i.type === "note" && (
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(i.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addNote")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label>{tApp("status")}</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as typeof f.type }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {interactionTypes.map((tp) => <SelectItem key={tp} value={tp}>{t(`types.${tp}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("noteTitle")}</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            </div>
            <div>
              <Label>{t("noteBody")}</Label>
              <Textarea rows={4} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tApp("cancel")}</Button>
              <Button type="submit" disabled={saving}>{tApp("save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
