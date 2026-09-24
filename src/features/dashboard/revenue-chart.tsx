import { formatMoney } from "@/lib/utils";
import type { Locale } from "@/i18n/config";

export function RevenueChart({ data, locale }: { data: { month: string; total: number }[]; locale: Locale }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  const monthFmt = new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "he-IL", { month: "short" });

  return (
    <div className="flex h-40 items-end gap-2">
      {data.map((d) => {
        const pct = Math.max(4, Math.round((d.total / max) * 100));
        const date = new Date(`${d.month}-01T00:00:00`);
        return (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[10px] font-medium text-muted-foreground text-telemetry">
              {d.total > 0 ? formatMoney(d.total, locale).replace(/\s?ILS|₪/, "") : ""}
            </span>
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-primary/40 to-primary shadow-glow"
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{monthFmt.format(date)}</span>
          </div>
        );
      })}
    </div>
  );
}
