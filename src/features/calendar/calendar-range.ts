import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  addMonths,
  addWeeks,
  addDays,
  eachDayOfInterval,
} from "date-fns";

export type CalendarView = "month" | "week" | "day" | "agenda";

/** Israel/local week starts Sunday. */
const WEEK_OPTS = { weekStartsOn: 0 as const };

export function getRange(view: CalendarView, anchor: Date): { start: Date; end: Date } {
  switch (view) {
    case "month": {
      const start = startOfWeek(startOfMonth(anchor), WEEK_OPTS);
      const end = endOfWeek(endOfMonth(anchor), WEEK_OPTS);
      return { start, end };
    }
    case "week":
      return { start: startOfWeek(anchor, WEEK_OPTS), end: endOfWeek(anchor, WEEK_OPTS) };
    case "day":
      return { start: startOfDay(anchor), end: endOfDay(anchor) };
    case "agenda":
      return { start: startOfDay(anchor), end: endOfDay(addDays(anchor, 30)) };
  }
}

export function shiftAnchor(view: CalendarView, anchor: Date, direction: 1 | -1): Date {
  switch (view) {
    case "month":
      return addMonths(anchor, direction);
    case "week":
      return addWeeks(anchor, direction);
    case "day":
      return addDays(anchor, direction);
    case "agenda":
      return addDays(anchor, direction * 30);
  }
}

export function monthGridDays(anchor: Date): Date[] {
  const { start, end } = getRange("month", anchor);
  return eachDayOfInterval({ start, end });
}

export function weekDays(anchor: Date): Date[] {
  const { start, end } = getRange("week", anchor);
  return eachDayOfInterval({ start, end });
}

export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 22;
