import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { Wallet, FileClock, Timer, FileCheck2, FileText, CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { EmptyState } from "@/components/shared/empty-state";
import { QuickActions } from "@/features/dashboard/quick-actions";
import { RevenueChart } from "@/features/dashboard/revenue-chart";
import { RetainerStatusStrip } from "@/features/dashboard/retainer-status-strip";
import { getDashboardStats, listRecentWorkOrders, getMonthlyRevenueTrend } from "@/server/queries/work-orders";
import { listActiveRetainersAllClients } from "@/server/queries/clients";
import { listUpcomingEvents } from "@/server/queries/calendar";
import { formatMoney, formatDate, formatDateTime } from "@/lib/utils";
import type { Locale } from "@/i18n/config";

export default async function DashboardPage() {
  const [t, tWo, locale] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("workOrders"),
    getLocale(),
  ]);
  const lang = locale as Locale;

  const [stats, retainers, recentWorkOrders, upcomingEvents, revenueTrend] = await Promise.all([
    getDashboardStats(),
    listActiveRetainersAllClients(),
    listRecentWorkOrders(6),
    listUpcomingEvents(5),
    getMonthlyRevenueTrend(6),
  ]);

  const metrics = [
    { label: t("billedThisMonth"), value: formatMoney(stats.billedThisMonth, lang), icon: Wallet, accent: "text-primary" },
    {
      label: t("pendingApprovals"),
      value: String(stats.pendingCount),
      sub: t("pendingValue", { value: formatMoney(stats.pendingValue, lang) }),
      icon: FileClock,
      accent: "text-warning",
    },
    { label: t("activeRetainers"), value: String(retainers.length), icon: Timer, accent: "text-voice" },
    { label: t("signedThisMonth"), value: String(stats.signedThisMonth), icon: FileCheck2, accent: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <QuickActions />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{m.label}</span>
              <m.icon className={`h-4 w-4 ${m.accent}`} />
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground text-telemetry">{m.value}</p>
            {m.sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{m.sub}</p>}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="pt-5">
              <p className="mb-4 text-sm font-semibold text-foreground">{t("revenueTrend")}</p>
              <RevenueChart data={revenueTrend} locale={lang} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{t("recentWorkOrders")}</p>
                <Link href="/work-orders" className="text-xs text-primary hover:underline">{t("viewAll")}</Link>
              </div>
              {recentWorkOrders.length === 0 ? (
                <EmptyState icon={FileText} title="—" className="py-8" />
              ) : (
                <div className="space-y-2">
                  {recentWorkOrders.map((wo) => (
                    <Link key={wo.id} href={`/work-orders/${wo.id}`} className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-muted/40">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{wo.title}</p>
                        <p className="text-xs text-muted-foreground">{wo.client?.name} · {formatDate(wo.date, lang)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-semibold text-primary text-telemetry">{formatMoney(wo.totalAmount, lang)}</span>
                        <Badge variant="outline" className="gap-1">
                          <StatusDot status={wo.status} /> {tWo(`statuses.${wo.status}`)}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <CalendarClock className="h-4 w-4 text-primary" /> {t("upcoming")}
                </p>
                <Link href="/calendar" className="text-xs text-primary hover:underline">{t("viewAll")}</Link>
              </div>
              {upcomingEvents.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">{t("noUpcoming")}</p>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.map((e) => (
                    <div key={e.id} className="flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{e.title}</p>
                        <p className="text-muted-foreground">{e.client?.name ?? "—"}</p>
                      </div>
                      <span className="shrink-0 text-muted-foreground text-telemetry">{formatDateTime(e.startTime, lang)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Timer className="h-4 w-4 text-voice" /> {t("retainerStatus")}
              </p>
              {retainers.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">{t("noRetainers")}</p>
              ) : (
                <RetainerStatusStrip retainers={retainers} locale={lang} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
