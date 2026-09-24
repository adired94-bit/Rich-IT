"use client";
import { MapPin, Video, CheckSquare, Users, Bell } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { statusColors } from "./status-colors";
import type { CalendarEvent, EventType } from "@/db/schema";
import type { Locale } from "@/i18n/config";

const typeIcons: Record<EventType, React.ElementType> = {
  visit: MapPin,
  remote: Video,
  task: CheckSquare,
  meeting: Users,
  reminder: Bell,
};

export function EventPill({
  event,
  locale,
  onClick,
  draggable,
  onDragStart,
  showTime = true,
  compact = false,
  clientName,
}: {
  event: Pick<CalendarEvent, "id" | "title" | "startTime" | "status" | "type" | "allDay">;
  locale: Locale;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  showTime?: boolean;
  compact?: boolean;
  clientName?: string | null;
}) {
  const colors = statusColors[event.status];
  const Icon = typeIcons[event.type];
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      className={cn(
        "w-full cursor-pointer truncate rounded-md border px-1.5 py-0.5 text-start text-[11px] leading-tight transition-transform hover:scale-[1.02]",
        colors.bg,
        colors.border,
        colors.text,
        compact && "px-1",
      )}
      title={clientName ? `${event.title} — ${clientName}` : event.title}
    >
      <span className="flex items-center gap-1">
        <Icon className="h-2.5 w-2.5 shrink-0" />
        {showTime && !event.allDay && <span className="shrink-0 font-medium">{formatTime(event.startTime, locale)}</span>}
        <span className="truncate">{event.title}</span>
      </span>
    </button>
  );
}
