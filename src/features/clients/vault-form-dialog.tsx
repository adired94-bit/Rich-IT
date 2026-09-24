"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upsertVaultEntryAction, revealVaultEntryAction } from "@/server/actions/clients";
import { vaultCategories } from "@/lib/validators/clients";
import type { VaultEntry } from "@/db/schema";

export function VaultFormDialog({
  open,
  onOpenChange,
  clientId,
  entry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  entry?: VaultEntry | null;
}) {
  const t = useTranslations("clients.vault");
  const tApp = useTranslations("app");
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    title: "",
    category: "credentials" as (typeof vaultCategories)[number],
    host: "",
    username: "",
    password: "",
    url: "",
    notes: "",
  });

  React.useEffect(() => {
    if (!open) return;
    if (!entry) {
      setForm({ title: "", category: "credentials", host: "", username: "", password: "", url: "", notes: "" });
      return;
    }
    setForm({ title: entry.title, category: entry.category, host: "", username: "", password: "", url: "", notes: "" });
    setLoading(true);
    revealVaultEntryAction(entry.id)
      .then((payload) => {
        setForm((f) => ({
          ...f,
          host: payload.host ?? "",
          username: payload.username ?? "",
          password: payload.password ?? "",
          url: payload.url ?? "",
          notes: payload.notes ?? "",
        }));
      })
      .catch(() => toast.error(tApp("error")))
      .finally(() => setLoading(false));
  }, [open, entry, tApp]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertVaultEntryAction({ id: entry?.id, clientId, ...form });
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
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>{t("entryTitle")}</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>
              <div>
                <Label>{t("category")}</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as typeof f.category }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {vaultCategories.map((c) => <SelectItem key={c} value={c}>{t(`categories.${c}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>{t("host")}</Label>
                <Input dir="ltr" value={form.host} onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))} placeholder="192.168.1.1" />
              </div>
              <div>
                <Label>{t("url")}</Label>
                <Input dir="ltr" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
              </div>
              <div>
                <Label>{t("username")}</Label>
                <Input dir="ltr" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
              </div>
              <div>
                <Label>{t("password")}</Label>
                <Input dir="ltr" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>{t("notes")}</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{tApp("cancel")}</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {tApp("save")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
