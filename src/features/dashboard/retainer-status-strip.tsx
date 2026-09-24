import { Progress } from "@/components/ui/progress";
import { formatNumber } from "@/lib/utils";
import type { listActiveRetainersAllClients } from "@/server/queries/clients";
import type { Locale } from "@/i18n/config";

type Row = Awaited<ReturnType<typeof listActiveRetainersAllClients>>[number];

export function RetainerStatusStrip({ retainers, locale }: { retainers: Row[]; locale: Locale }) {
  return (
    <div className="space-y-3">
      {retainers.map((r) => {
        const remaining = r.totalHours - r.usedHours;
        const pct = Math.min(100, Math.round((r.usedHours / r.totalHours) * 100));
        const exceeded = remaining < 0;
        return (
          <div key={r.id}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{r.client.name}</span>
              <span className={exceeded ? "font-semibold text-destructive" : "text-muted-foreground"}>
                {formatNumber(Math.max(0, remaining), locale)} / {formatNumber(r.totalHours, locale)}
              </span>
            </div>
            <Progress value={pct} indicatorClassName={exceeded ? "bg-destructive" : undefined} className="h-1.5" />
          </div>
        );
      })}
    </div>
  );
}
