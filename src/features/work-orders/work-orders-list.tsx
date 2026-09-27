"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Search, Plus, FileText, DollarSign, CheckCircle2, CircleAlert, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";
import { EmptyState } from "@/components/shared/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, formatMoney } from "@/lib/utils";
import { workOrderStatuses } from "@/lib/validators/work-orders";
import type { listWorkOrders } from "@/server/queries/work-orders";
import type { Locale } from "@/i18n/config";

type Row = Awaited<ReturnType<typeof listWorkOrders>>[number];

/** Drill-down views opened from the dashboard cards; mirror getDashboardStats(). */
export type WorkOrdersView = "pending" | "signed-month";

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function matchesView(r: Row, view: WorkOrdersView | null) {
  if (view === "pending") return r.status === "sent" || r.status === "viewed";
  if (view === "signed-month") return r.status === "signed" && !!r.signedAt && new Date(r.signedAt) >= startOfMonth();
  return true;
}

export function WorkOrdersList({ rows, initialView = null }: { rows: Row[]; initialView?: WorkOrdersView | null }) {
  const t = useTranslations("workOrders");
  const tApp = useTranslations("app");
  const tDash = useTranslations("dashboard");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [view, setView] = React.useState<WorkOrdersView | null>(initialView);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (!matchesView(r, view)) return false;
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return r.number.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.client.name.toLowerCase().includes(q);
    });
  }, [rows, search, status, view]);

  const viewTotal = React.useMemo(() => filtered.reduce((sum, r) => sum + r.totalAmount, 0), [filtered]);

  const isPaidFolder = pathname?.includes("/paid");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button asChild variant={!isPaidFolder ? "default" : "outline"} size="sm" className="gap-1.5">
          <Link href="/work-orders">
            <FileText className="h-4 w-4" /> {t("title")}
          </Link>
        </Button>
        <Button asChild variant={isPaidFolder ? "success" : "outline"} size="sm" className="gap-1.5">
          <Link href="/work-orders/paid">
            <DollarSign className="h-4 w-4" /> {t("paidFolder")}
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchPlaceholder")} className="ps-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tApp("all")}</SelectItem>
            {workOrderStatuses.map((s) => <SelectItem key={s} value={s}>{t(`statuses.${s}`)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button asChild className="gap-1.5">
          <Link href="/work-orders/new"><Plus className="h-4 w-4" /> {t("new")}</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {view && (
          <Badge variant="primary" className="gap-1.5 py-1">
            {view === "pending" ? tDash("pendingApprovals") : tDash("signedThisMonth")}
            <span className="text-telemetry">· {formatMoney(viewTotal, locale)}</span>
            <button type="button" onClick={() => setView(null)} aria-label={tApp("close")} className="rounded-full hover:opacity-70">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        <p className="text-xs text-muted-foreground">{t("count", { count: filtered.length })}</p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title={tApp("empty")} />
      ) : (
        <div className="space-y-2">
          {filtered.map((wo) => {
            const isFullyComplete = wo.isCompleted && wo.isPaid;
            const isDoneUnpaid = wo.isCompleted && !wo.isPaid;
            
            return (
              <Link key={wo.id} href={`/work-orders/${wo.id}`}>
                <Card className="glow-hover flex flex-wrap items-center justify-between gap-3 p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{wo.title}</p>
                      <p className="text-xs text-muted-foreground">{wo.number} · {wo.client.name} · {formatDate(wo.date, locale)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary text-telemetry">{formatMoney(wo.totalAmount, locale)}</span>
                    <Badge variant="outline" className="gap-1">
                      <StatusDot status={wo.status} /> {t(`statuses.${wo.status}`)}
                    </Badge>
                    {isFullyComplete && (
                      <Badge variant="success" className="gap-1">
                        <DollarSign className="h-3 w-3" /> {t("paid")}
                      </Badge>
                    )}
                    {isDoneUnpaid && wo.status === "signed" && (
                      <>
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> {t("completed")}
                        </Badge>
                        <Badge variant="warning" className="gap-1">
                          <CircleAlert className="h-3 w-3" /> {t("notPaid")}
                        </Badge>
                      </>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
