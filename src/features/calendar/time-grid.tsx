"use client";
import * as React from "react";
import { isSameDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { EventPill } from "./event-pill";
import { DAY_START_HOUR, DAY_END_HOUR } from "./calendar-range";
import type { Locale } from "@/i18n/config";
import type { CalendarEvent } from "@/db/schema";

type EventWithClient = CalendarEvent & { client: { id: string; name: string } | null };

const HOUR_HEIGHT = 56; // px

export function TimeGrid({
  days,
  events,
  locale,
  onSlotClick,
  onEventClick,
  onEventDrop,
}: {
  days: Date[];
  events: EventWithClient[];
  locale: Locale;
  onSlotClick: (day: Date, hour: number) => void;
  onEventClick: (event: EventWithClient) => void;
  onEventDrop: (eventId: string, day: Date, hour: number) => void;
}) {
  const hours = React.useMemo(
    () => Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i),
    [],
  );
  const [dragOver, setDragOver] = React.useState<string | null>(null);
  const gridHeight = hours.length * HOUR_HEIGHT;

  const allDayEvents = events.filter((e) => e.allDay);
  const timedEvents = events.filter((e) => !e.allDay);

  function layoutFor(day: Date) {
    return timedEvents.filter((e) => isSameDay(new Date(e.startTime), day));
  }

  function topFor(date: Date) {
    const h = date.getHours() + date.getMinutes() / 60;
    return Math.max(0, (h - DAY_START_HOUR) * HOUR_HEIGHT);
  }
  function heightFor(start: Date, end: Date) {
    const minutes = Math.max(20, (end.getTime() - start.getTime()) / 60000);
    return (minutes / 60) * HOUR_HEIGHT;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {/* Day headers */}
      <div className="grid border-b border-border bg-muted/40 text-center text-xs font-medium" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
        <div />
        {days.map((d) => (
          <div key={d.toISOString()} className={cn("py-2", isToday(d) && "text-primary")}>
            <div>{d.toLocaleDateString(locale === "he" ? "he-IL" : "ru-RU", { weekday: "short" })}</div>
            <div className={cn("mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[11px]", isToday(d) && "bg-primary text-primary-foreground font-bold")}>
              {d.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* All-day row */}
      {allDayEvents.length > 0 && (
        <div className="grid border-b border-border" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
          <div className="border-e border-border p-1 text-[10px] text-muted-foreground">All day</div>
          {days.map((d) => (
            <div key={d.toISOString()} className="space-y-0.5 border-e border-border p-1 last:border-e-0">
              {allDayEvents.filter((e) => isSameDay(new Date(e.startTime), d)).map((ev) => (
                <div key={ev.id} onClick={() => onEventClick(ev)}>
                  <EventPill event={ev} locale={locale} clientName={ev.client?.name} showTime={false} compact />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Scrollable hour grid */}
      <div className="max-h-[65vh] overflow-y-auto">
        <div className="relative grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)`, height: gridHeight }}>
          {/* hour labels column */}
          <div className="relative border-e border-border">
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR_HEIGHT }} className="border-b border-border px-1 pt-0.5 text-end text-[10px] text-muted-foreground">
                {h}:00
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayEvents = layoutFor(day);
            return (
              <div key={day.toISOString()} className="relative border-e border-border last:border-e-0">
                {hours.map((h) => {
                  const slotKey = `${day.toISOString()}-${h}`;
                  return (
                    <div
                      key={h}
                      style={{ height: HOUR_HEIGHT }}
                      className={cn("cursor-pointer border-b border-border transition-colors hover:bg-muted/30", dragOver === slotKey && "bg-accent")}
                      onClick={() => onSlotClick(day, h)}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(slotKey); }}
                      onDragLeave={() => setDragOver((k) => (k === slotKey ? null : k))}
                      onDrop={(e) => {
                        e.preventDefault();
                        const id = e.dataTransfer.getData("text/event-id");
                        if (id) onEventDrop(id, day, h);
                        setDragOver(null);
                      }}
                    />
                  );
                })}
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/event-id", ev.id)}
                    onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                    className="absolute inset-x-0.5 z-10"
                    style={{ top: topFor(new Date(ev.startTime)), height: heightFor(new Date(ev.startTime), new Date(ev.endTime)) }}
                  >
                    <EventPill event={ev} locale={locale} clientName={ev.client?.name} draggable />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
