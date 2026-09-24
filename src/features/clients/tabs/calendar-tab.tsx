"use client";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@/lib/utils";
import type { listClientEvents } from "@/server/queries/clients";
import type { Locale } from "@/i18n/config";

export function CalendarTab({ events }: { events: Awaited<ReturnType<typeof listClientEvents>> }) {
  const t = useTranslations("calendar");
  const tApp = useTranslations("app");
  const locale = useLocale() as Locale;
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.startTime).getTime() >= now).sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));
  const past = events.filter((e) => new Date(e.startTime).getTime() < now).sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime));

  if (events.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title={t("noEvents")}
        action={
          <Link href="/calendar" className="text-xs text-primary underline underline-offset-4">
            {t("new")}
          </Link>
        }
      />
    );
  }

  const Section = ({ title, items }: { title: string; items: typeof events }) =>
    items.length > 0 ? (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        <div className="space-y-2">
          {items.map((e) => (
            <Card key={e.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{e.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{formatDateTime(e.startTime, locale)}</span>
                  {e.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {e.location}
                    </span>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 gap-1">
                <StatusDot status={e.status} /> {t(`statuses.${e.status}`)}
              </Badge>
            </Card>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link href="/calendar" className="text-xs text-primary underline underline-offset-4">
          {tApp("more")} →
        </Link>
      </div>
      <Section title={tApp("today")} items={upcoming} />
      <Section title={t("agenda")} items={past} />
    </div>
  );
}
