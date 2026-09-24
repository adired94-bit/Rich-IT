"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { isSameDay } from "date-fns";
import { CalendarX2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, formatTime } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import type { CalendarEvent } from "@/db/schema";

type EventWithClient = CalendarEvent & { client: { id: string; name: string } | null };

export function AgendaView({ events, locale, onEventClick }: { events: EventWithClient[]; locale: Locale; onEventClick: (e: EventWithClient) => void }) {
  const t = useTranslations("calendar");
  const tApp = useTranslations("app");

  if (events.length === 0) {
    return <EmptyState icon={CalendarX2} title={t("noEvents")} />;
  }

  const sorted = [...events].sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));
  const groups: { day: Date; items: EventWithClient[] }[] = [];
  for (const ev of sorted) {
    const day = new Date(ev.startTime);
    const last = groups[groups.length - 1];
    if (last && isSameDay(last.day, day)) last.items.push(ev);
    else groups.push({ day, items: [ev] });
  }

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <div key={g.day.toISOString()}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{formatDate(g.day, locale, { weekday: "long", day: "2-digit", month: "2-digit" })}</p>
          <div className="space-y-2">
            {g.items.map((ev) => (
              <Card key={ev.id} className="glow-hover flex cursor-pointer items-center justify-between gap-3 p-3" onClick={() => onEventClick(ev)}>
                <div className="flex items-center gap-3">
                  <div className="w-14 shrink-0 text-xs font-semibold text-foreground text-telemetry">
                    {ev.allDay ? tApp("today") : formatTime(ev.startTime, locale)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{ev.title}</p>
                    {ev.client && <p className="text-xs text-muted-foreground">{ev.client.name}</p>}
                  </div>
                </div>
                <Badge variant="outline" className="gap-1">
                  <StatusDot status={ev.status} /> {t(`statuses.${ev.status}`)}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
