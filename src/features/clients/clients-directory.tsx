"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Search, Plus, Phone, Mail, Users, Trash2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusDot } from "@/components/ui/status-dot";
import { EmptyState } from "@/components/shared/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { ClientFormDialog } from "./client-form-dialog";
import { deleteClientAction } from "@/server/actions/clients";
import { formatMoney, initials } from "@/lib/utils";
import { clientStatuses } from "@/lib/validators/clients";
import type { Client } from "@/db/schema";
import type { Locale } from "@/i18n/config";

interface Row {
  client: Client;
  openDocuments: number;
  totalBilled: number;
}

export function ClientsDirectory({ rows }: { rows: Row[] }) {
  const t = useTranslations("clients");
  const tApp = useTranslations("app");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Client | null>(null);
  const [deleting, setDeleting] = React.useState<Client | null>(null);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(({ client: c }) => {
      if (status !== "all" && c.status !== status) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.contactPerson?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    });
  }, [rows, search, status]);

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteClientAction(deleting.id);
      toast.success(tApp("deleted"));
      router.refresh();
    } catch {
      toast.error(tApp("error"));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchPlaceholder")} className="ps-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tApp("all")}</SelectItem>
            {clientStatuses.map((s) => <SelectItem key={s} value={s}>{t(`statuses.${s}`)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" /> {t("new")}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{t("count", { count: filtered.length })}</p>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title={tApp("empty")} description={tApp("noResults")} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ client: c, openDocuments, totalBilled }) => (
            <Card key={c.id} className="glow-hover flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/clients/${c.id}`} className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border-strong">
                    <AvatarFallback>{initials(c.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.contactPerson || "—"}</p>
                  </div>
                </Link>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(c); setFormOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(c)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="gap-1">
                  <StatusDot status={c.status} />
                  {t(`statuses.${c.status}`)}
                </Badge>
                {c.slaLevel !== "none" && <Badge variant="primary">{t(`slaLevels.${c.slaLevel}`)}</Badge>}
              </div>

              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 hover:text-foreground">
                    <Phone className="h-3 w-3" /> {c.phone}
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 hover:text-foreground truncate">
                    <Mail className="h-3 w-3" /> {c.email}
                  </a>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-border pt-2 text-xs">
                <span className="text-muted-foreground">{t("overview.totalBilled")}</span>
                <span className="font-semibold text-primary text-telemetry">{formatMoney(totalBilled, locale)}</span>
              </div>
              {openDocuments > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t("overview.openDocuments")}</span>
                  <Badge variant="warning">{openDocuments}</Badge>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <ClientFormDialog open={formOpen} onOpenChange={setFormOpen} client={editing} onSaved={() => router.refresh()} />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tApp("confirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteWarning")}</AlertDialogDescription>
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
