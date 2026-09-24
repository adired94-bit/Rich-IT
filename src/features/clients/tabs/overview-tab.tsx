"use client";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CalendarClock, Wallet } from "lucide-react";
import { formatMoney, formatDateTime } from "@/lib/utils";
import type { listInteractions, listClientEvents, getClientOverviewStats } from "@/server/queries/clients";
import type { Client } from "@/db/schema";
import type { Locale } from "@/i18n/config";

export function OverviewTab({
  client,
  stats,
  interactions,
  events,
  locale,
}: {
  client: Client;
  stats: Awaited<ReturnType<typeof getClientOverviewStats>>;
  interactions: Awaited<ReturnType<typeof listInteractions>>;
  events: Awaited<ReturnType<typeof listClientEvents>>;
  locale: Locale;
}) {
  const t = useTranslations("clients.overview");
  const tClients = useTranslations("clients");
  const tHist = useTranslations("clients.history.types");
  const now = Date.now();
  const nextEvent = events
    .filter((e) => new Date(e.startTime).getTime() >= now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
  const lastVisit = interactions.find((i) => i.type === "visit" || i.type === "remote");

  const cards = [
    { label: t("totalBilled"), value: formatMoney(stats.totalBilled, locale), icon: Wallet },
    { label: t("openDocuments"), value: String(stats.openDocuments), icon: FileText },
    { label: t("lastVisit"), value: lastVisit ? formatDateTime(lastVisit.occurredAt, locale) : "—", icon: Clock },
    { label: t("nextEvent"), value: nextEvent ? formatDateTime(nextEvent.startTime, locale) : "—", icon: CalendarClock },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <c.icon className="h-4 w-4" />
              <span className="text-xs">{c.label}</span>
            </div>
            <p className="mt-2 text-lg font-bold text-foreground text-telemetry">{c.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-5">
          <p className="mb-3 text-sm font-semibold text-foreground">{t("recentActivity")}</p>
          {interactions.length === 0 ? (
            <p className="text-xs text-muted-foreground">—</p>
          ) : (
            <ul className="space-y-3">
              {interactions.slice(0, 6).map((i) => (
                <li key={i.id} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm text-foreground">{i.title}</p>
                    {i.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{i.body}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant="outline">{tHist(i.type)}</Badge>
                    <span className="text-[11px] text-muted-foreground">{formatDateTime(i.occurredAt, locale)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {client.notes && (
        <Card>
          <CardContent className="pt-5">
            <p className="mb-2 text-sm font-semibold text-foreground">{tClients("notes")}</p>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{client.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
