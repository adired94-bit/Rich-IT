"use client";
import { useTranslations, useLocale } from "next-intl";
import { Plus, Trash2, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoney } from "@/lib/utils";
import { itemTypes, type WorkOrderItemValues } from "@/lib/validators/work-orders";
import type { Locale } from "@/i18n/config";

export function ItemEditor({
  items,
  onChange,
  onAddCatalog,
}: {
  items: WorkOrderItemValues[];
  onChange: (items: WorkOrderItemValues[]) => void;
  onAddCatalog: () => void;
}) {
  const t = useTranslations("workOrders");
  const tCatalog = useTranslations("catalog");
  const tApp = useTranslations("app");
  const locale = useLocale() as Locale;

  function update(index: number, patch: Partial<WorkOrderItemValues>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }
  function addBlank() {
    onChange([...items, { itemType: "service", description: "", descriptionRu: "", quantity: 1, unit: "unit", unitPrice: 0, discount: 0 }]);
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <th className="px-2 py-2 text-start font-medium">{t("itemType")}</th>
              <th className="px-2 py-2 text-start font-medium">{tApp("description")}</th>
              <th className="w-20 px-2 py-2 text-start font-medium">{tApp("quantity")}</th>
              <th className="w-28 px-2 py-2 text-start font-medium">{tApp("unitPrice")}</th>
              <th className="w-24 px-2 py-2 text-start font-medium">{tApp("discount")}</th>
              <th className="w-28 px-2 py-2 text-end font-medium">{t("total")}</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const total = Math.max(0, item.quantity * item.unitPrice - item.discount);
              return (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-2 py-1.5">
                    <Select value={item.itemType} onValueChange={(v) => update(i, { itemType: v as typeof item.itemType })}>
                      <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {itemTypes.map((tp) => <SelectItem key={tp} value={tp}>{t(`itemTypes.${tp}`)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-1.5">
                    <Input className="h-8" value={item.description} onChange={(e) => update(i, { description: e.target.value })} />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input type="number" min={0} step="0.01" className="h-8" value={item.quantity} onChange={(e) => update(i, { quantity: Number(e.target.value) })} />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input type="number" min={0} step="0.01" className="h-8" value={item.unitPrice} onChange={(e) => update(i, { unitPrice: Number(e.target.value) })} />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input type="number" min={0} step="0.01" className="h-8" value={item.discount} onChange={(e) => update(i, { discount: Number(e.target.value) })} />
                  </td>
                  <td className="px-2 py-1.5 text-end font-semibold text-telemetry">{formatMoney(total, locale)}</td>
                  <td className="px-1">
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(i)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 py-6 text-center text-xs text-muted-foreground">
                  {tCatalog("count", { count: 0 })}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addBlank}>
          <Plus className="h-3.5 w-3.5" /> {t("addItem")}
        </Button>
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onAddCatalog}>
          <ListPlus className="h-3.5 w-3.5" /> {t("addFromCatalog")}
        </Button>
      </div>
    </div>
  );
}
