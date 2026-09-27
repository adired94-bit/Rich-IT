import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { Timer } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
import { listActiveRetainersAllClients } from "@/server/queries/clients";
import { formatDate, formatMoney, formatNumber } from "@/lib/utils";
import type { Locale } from "@/i18n/config";

export default async function RetainersPage() {
  const [t, tDash, locale, retainers] = await Promise.all([
    getTranslations("clients.retainers"),
    getTranslations("dashboard"),
    getLocale(),
    listActiveRetainersAllClients(),
  ]);
  const lang = locale as Locale;

  return (
    <div className="space-y-4">
      <PageHeader title={tDash("activeRetainers")} subtitle={t("title")} />
      {retainers.length === 0 ? (
        <EmptyState icon={Timer} title={t("empty")} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {retainers.map((r) => {
            const remaining = r.totalHours - r.usedHours;
            const pct = r.totalHours > 0 ? Math.min(100, Math.round((r.usedHours / r.totalHours) * 100)) : 0;
            const exceeded = remaining < 0;
            return (
              <Link key={r.id} href={`/clients/${r.clientId}`}>
                <Card className="glow-hover space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{r.client.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.title}</p>
                    </div>
                    {exceeded && <Badge variant="destructive">{t("exceeded")}</Badge>}
                  </div>
                  <Progress value={pct} indicatorClassName={exceeded ? "bg-destructive" : undefined} className="h-1.5" />
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">{t("usedHours")}</p>
                      <p className="font-semibold text-foreground text-telemetry">{formatNumber(r.usedHours, lang)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("remaining")}</p>
                      <p className={exceeded ? "font-semibold text-destructive text-telemetry" : "font-semibold text-foreground text-telemetry"}>
                        {formatNumber(remaining, lang)} / {formatNumber(r.totalHours, lang)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("monthlyFee")}</p>
                      <p className="font-semibold text-primary text-telemetry">{formatMoney(r.monthlyFee, lang)}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("period")}: {formatDate(r.periodStart, lang)} – {formatDate(r.periodEnd, lang)}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
