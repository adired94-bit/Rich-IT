"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { isSameDay, isSameMonth, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { EventPill } from "./event-pill";
import { monthGridDays } from "./calendar-range";
import { hebrewDateShort, type HolidayInfo } from "@/lib/hebrew-calendar";
import type { Locale } from "@/i18n/config";
import type { CalendarEvent } from "@/db/schema";

type EventWithClient = CalendarEvent & { client: { id: string; name: string } | null };

const WEEKDAY_KEYS_HE = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

export function MonthView({
  anchor,
  events,
  holidays,
  locale,
  onDayClick,
  onEventClick,
  onEventDrop,
}: {
  anchor: Date;
  events: EventWithClient[];
  holidays: HolidayInfo[];
  locale: Locale;
  onDayClick: (day: Date) => void;
  onEventClick: (event: EventWithClient) => void;
  onEventDrop: (eventId: string, newDay: Date) => void;
}) {
  const days = React.useMemo(() => monthGridDays(anchor), [anchor]);
  const [dragOverDay, setDragOverDay] = React.useState<string | null>(null);
  const t = useTranslations("calendar");

  function eventsForDay(day: Date) {
    return events.filter((e) => isSameDay(new Date(e.startTime), day)).sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));
  }
  function holidaysForDay(day: Date) {
    return holidays.filter((h) => isSameDay(h.date, day));
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-[11px] font-medium text-muted-foreground">
        {WEEKDAY_KEYS_HE.map((d, i) => (
          <div key={i} className="py-2">{locale === "he" ? d : ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][i]}</div>
        ))}
      </div>
      <div className="grid grid-cols-7" title={t("dragHint")}>
        {days.map((day) => {
          const dayEvents = eventsForDay(day);
          const dayHolidays = holidaysForDay(day);
          const mainHoliday = dayHolidays.find((h) => h.isMajor) ?? dayHolidays[0];
          const dimmed = !isSameMonth(day, anchor);
          const key = day.toISOString();
          return (
            <div
              key={key}
              onClick={() => onDayClick(day)}
              onDragOver={(e) => { e.preventDefault(); setDragOverDay(key); }}
              onDragLeave={() => setDragOverDay((k) => (k === key ? null : k))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/event-id");
                if (id) onEventDrop(id, day);
                setDragOverDay(null);
              }}
              title={dayHolidays.length ? (locale === "he" ? dayHolidays.map((h) => h.titleHe).join(", ") : dayHolidays.map((h) => h.titleEn).join(", ")) : undefined}
              className={cn(
                "min-h-24 cursor-pointer border-b border-e border-border p-1.5 transition-colors hover:bg-muted/30",
                dimmed && "bg-muted/10 text-muted-foreground",
                mainHoliday?.isMajor && "bg-primary/5",
                dragOverDay === key && "bg-accent",
              )}
            >
              <div className="mb-0.5 flex items-start justify-between gap-1">
                <span className="truncate text-[9px] leading-tight text-muted-foreground">{hebrewDateShort(day)}</span>
                <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]", isToday(day) && "bg-primary text-primary-foreground font-bold")}>
                  {day.getDate()}
                </span>
              </div>
              {mainHoliday && (
                <p className={cn("mb-1 truncate text-[9px] font-medium", mainHoliday.isMajor ? "text-primary" : "text-muted-foreground")}>
                  {mainHoliday.emoji ? `${mainHoliday.emoji} ` : ""}
                  {locale === "he" ? mainHoliday.titleHe : mainHoliday.titleEn}
                </p>
              )}
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/event-id", ev.id);
                      e.stopPropagation();
                    }}
                    onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                  >
                    <EventPill event={ev} locale={locale} clientName={ev.client?.name} compact draggable />
                  </div>
                ))}
                {dayEvents.length > 3 && <p className="ps-1 text-[10px] text-muted-foreground">+{dayEvents.length - 3}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
