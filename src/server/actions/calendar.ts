"use server";

import { db } from "@/db";
import { calendarEvents, interactionLogs } from "@/db/schema";
import { eventFormSchema, eventStatuses } from "@/lib/validators/calendar";
import { listEventsInRange } from "@/server/queries/calendar";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function fetchEventsAction(startIso: string, endIso: string, clientId?: string) {
  return listEventsInRange(new Date(startIso), new Date(endIso), clientId);
}

function nullIfEmpty(v?: string | null) {
  return v && v.trim() !== "" ? v.trim() : null;
}

export async function upsertEventAction(raw: z.infer<typeof eventFormSchema>) {
  const data = eventFormSchema.parse(raw);
  const values = {
    clientId: data.clientId || null,
    title: data.title,
    description: nullIfEmpty(data.description),
    location: nullIfEmpty(data.location),
    startTime: new Date(data.startTime),
    endTime: new Date(data.endTime),
    allDay: data.allDay,
    status: data.status,
    type: data.type,
  };

  let id = data.id;
  if (id) {
    await db.update(calendarEvents).set(values).where(eq(calendarEvents.id, id));
  } else {
    const [row] = await db.insert(calendarEvents).values(values).returning({ id: calendarEvents.id });
    id = row.id;
  }

  if (values.clientId && values.status === "completed") {
    await db.insert(interactionLogs).values({
      clientId: values.clientId,
      type: values.type === "remote" ? "remote" : "visit",
      title: values.title,
      body: values.description,
      eventId: id,
      occurredAt: values.startTime,
    });
  }

  revalidatePath("/calendar");
  if (values.clientId) revalidatePath(`/clients/${values.clientId}`);
  revalidatePath("/");
  return { ok: true as const, id: id! };
}

export async function deleteEventAction(id: string, clientId?: string | null) {
  await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  revalidatePath("/calendar");
  if (clientId) revalidatePath(`/clients/${clientId}`);
  return { ok: true as const };
}

export async function moveEventAction(id: string, startTime: string, endTime: string) {
  await db.update(calendarEvents).set({ startTime: new Date(startTime), endTime: new Date(endTime) }).where(eq(calendarEvents.id, id));
  revalidatePath("/calendar");
  return { ok: true as const };
}

export async function updateEventStatusAction(id: string, status: (typeof eventStatuses)[number]) {
  await db.update(calendarEvents).set({ status }).where(eq(calendarEvents.id, id));
  revalidatePath("/calendar");
  return { ok: true as const };
}
