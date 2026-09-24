import "server-only";
import { db } from "@/db";
import { calendarEvents } from "@/db/schema";
import { and, asc, eq, gte, lte, or } from "drizzle-orm";

export async function listEventsInRange(start: Date, end: Date, clientId?: string) {
  const conditions = [lte(calendarEvents.startTime, end), gte(calendarEvents.endTime, start)];
  if (clientId) conditions.push(eq(calendarEvents.clientId, clientId));
  return db.query.calendarEvents.findMany({
    where: and(...conditions),
    orderBy: [asc(calendarEvents.startTime)],
    with: { client: { columns: { id: true, name: true } } },
  });
}

export async function listUpcomingEvents(limit = 5) {
  return db.query.calendarEvents.findMany({
    where: or(gte(calendarEvents.startTime, new Date()), eq(calendarEvents.status, "in_progress")),
    orderBy: [asc(calendarEvents.startTime)],
    limit,
    with: { client: { columns: { id: true, name: true } } },
  });
}

export async function listAllEventsForIcs() {
  return db.query.calendarEvents.findMany({
    orderBy: [asc(calendarEvents.startTime)],
    with: { client: { columns: { id: true, name: true } } },
  });
}

export async function getEvent(id: string) {
  return db.query.calendarEvents.findFirst({ where: eq(calendarEvents.id, id) });
}
