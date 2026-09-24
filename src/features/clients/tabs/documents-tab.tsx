"use client";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, formatMoney } from "@/lib/utils";
import type { listClientWorkOrders } from "@/server/queries/clients";
import type { Locale } from "@/i18n/config";

export function DocumentsTab({ workOrders }: { workOrders: Awaited<ReturnType<typeof listClientWorkOrders>> }) {
  const t = useTranslations("clients.documents");
  const tWo = useTranslations("workOrders");
  const locale = useLocale() as Locale;

  if (workOrders.length === 0) {
    return <EmptyState icon={FileText} title={t("empty")} />;
  }

  return (
    <div className="space-y-2">
      {workOrders.map((wo) => (
        <Link key={wo.id} href={`/work-orders/${wo.id}`}>
          <Card className="glow-hover flex items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">{wo.title} · {wo.number}</p>
                <p className="text-xs text-muted-foreground">{formatDate(wo.date, locale)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-primary text-telemetry">{formatMoney(wo.totalAmount, locale)}</span>
              <Badge variant="outline" className="gap-1">
                <StatusDot status={wo.status} /> {tWo(`statuses.${wo.status}`)}
              </Badge>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
