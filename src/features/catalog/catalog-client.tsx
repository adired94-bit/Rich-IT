"use client";
import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Search, Plus, Pencil, Copy, Trash2, ListChecks, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { CategoryBadge } from "./category-badge";
import { ServiceFormDialog } from "./service-form-dialog";
import { deleteServiceAction, duplicateServiceAction, seedCatalogAction, toggleServiceActiveAction } from "@/server/actions/catalog";
import { serviceCategories } from "@/lib/validators/catalog";
import { formatMoney } from "@/lib/utils";
import type { Service } from "@/db/schema";
import type { Locale } from "@/i18n/config";

const KNOWN_UNITS = new Set(["hour", "unit", "month", "project", "point", "meter", "device", "user"]);

function unitLabel(unit: string, t: ReturnType<typeof useTranslations>) {
  return KNOWN_UNITS.has(unit) ? t(`units.${unit}` as "units.unit") : unit;
}

export function CatalogClient({ services }: { services: Service[] }) {
  const t = useTranslations("catalog");
  const tApp = useTranslations("app");
  const locale = useLocale() as Locale;

  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<string>("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Service | null>(null);
  const [deleting, setDeleting] = React.useState<Service | null>(null);
  const [seeding, setSeeding] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      if (category !== "all" && s.category !== category) return false;
      if (!q) return true;
      return (
        s.titleHe.toLowerCase().includes(q) ||
        s.titleRu.toLowerCase().includes(q) ||
        s.sku?.toLowerCase().includes(q) ||
        s.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [services, search, category]);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(s: Service) {
    setEditing(s);
    setFormOpen(true);
  }

  async function handleDuplicate(s: Service) {
    try {
      await duplicateServiceAction(s.id);
      toast.success(tApp("saved"));
    } catch {
      toast.error(tApp("error"));
    }
  }

  async function handleToggle(s: Service, active: boolean) {
    try {
      await toggleServiceActiveAction(s.id, active);
    } catch {
      toast.error(tApp("error"));
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteServiceAction(deleting.id);
      toast.success(tApp("deleted"));
    } catch {
      toast.error(tApp("error"));
    } finally {
      setDeleting(null);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const res = await seedCatalogAction();
      toast.success(`${t("seedDone")} (+${res.inserted})`);
    } catch {
      toast.error(tApp("error"));
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchPlaceholder")} className="ps-9" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tApp("all")}</SelectItem>
            {serviceCategories.map((c) => (
              <SelectItem key={c} value={c}>{t(`categories.${c}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {services.length === 0 && (
          <Button variant="outline" onClick={handleSeed} disabled={seeding} className="gap-1.5">
            <Sparkles className="h-4 w-4" /> {t("seed")}
          </Button>
        )}
        <Button onClick={openNew} className="gap-1.5">
          <Plus className="h-4 w-4" /> {t("new")}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{t("count", { count: filtered.length })}</p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={tApp("empty")}
          description={services.length === 0 ? t("seedCatalogHint") : tApp("noResults")}
          action={
            services.length === 0 ? (
              <Button onClick={handleSeed} disabled={seeding} className="gap-1.5">
                <Sparkles className="h-4 w-4" /> {t("seed")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <Card key={s.id} className="glow-hover flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{locale === "ru" ? s.titleRu : s.titleHe}</p>
                  <p className="truncate text-xs text-muted-foreground">{locale === "ru" ? s.titleHe : s.titleRu}</p>
                </div>
                <Switch checked={s.active} onCheckedChange={(v) => handleToggle(s, v)} />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <CategoryBadge category={s.category} />
                <Badge variant="outline">{t(`billingTypes.${s.billingType}`)}</Badge>
                {s.sku && <Badge variant="outline" className="font-mono">{s.sku}</Badge>}
              </div>

              <div className="mt-auto flex items-end justify-between pt-2">
                <div>
                  <p className="text-lg font-bold text-primary text-telemetry">{formatMoney(s.defaultPrice, locale)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {unitLabel(s.unit, t)}
                    {s.billingType === "hardware_markup" && s.markupPercent ? ` · +${s.markupPercent}%` : ""}
                    {s.billingType === "retainer" && s.includedHours ? ` · ${s.includedHours} ${tApp("hours")}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(s)} title={tApp("edit")}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => handleDuplicate(s)} title={tApp("duplicate")}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(s)} title={tApp("delete")}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ServiceFormDialog open={formOpen} onOpenChange={setFormOpen} service={editing} />

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
