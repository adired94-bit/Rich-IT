"use client";
import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CategoryBadge } from "@/features/catalog/category-badge";
import { formatMoney } from "@/lib/utils";
import type { Service } from "@/db/schema";
import type { Locale } from "@/i18n/config";

export function CatalogPickerDialog({
  open,
  onOpenChange,
  services,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: Service[];
  onPick: (service: Service) => void;
}) {
  const t = useTranslations("catalog");
  const tWo = useTranslations("workOrders");
  const locale = useLocale() as Locale;
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter(
      (s) =>
        s.titleHe.toLowerCase().includes(q) ||
        s.titleRu.toLowerCase().includes(q) ||
        s.keywords.some((k) => k.toLowerCase().includes(q)),
    );
  }, [services, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{tWo("addFromCatalog")}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchPlaceholder")} className="ps-9" />
        </div>
        <ScrollArea className="h-96">
          <div className="space-y-1.5 pe-2">
            {filtered.map((s) => (
              <Card
                key={s.id}
                className="glow-hover flex cursor-pointer items-center justify-between gap-2 p-2.5"
                onClick={() => {
                  onPick(s);
                  onOpenChange(false);
                  setSearch("");
                }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{locale === "ru" ? s.titleRu : s.titleHe}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <CategoryBadge category={s.category} />
                    {s.sku && <Badge variant="outline" className="font-mono">{s.sku}</Badge>}
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold text-primary text-telemetry">{formatMoney(s.defaultPrice, locale)}</span>
              </Card>
            ))}
            {filtered.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">{t("searchPlaceholder")}</p>}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
