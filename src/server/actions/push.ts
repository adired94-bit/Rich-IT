"use server";

import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { requireUser } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

export async function subscribePushAction(raw: unknown, userAgent?: string) {
  await requireUser();
  const data = subscriptionSchema.parse(raw);
  await db
    .insert(pushSubscriptions)
    .values({ endpoint: data.endpoint, keys: data.keys, userAgent: userAgent ?? null })
    .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { keys: data.keys, userAgent: userAgent ?? null } });
  return { ok: true as const };
}

export async function unsubscribePushAction(endpoint: string) {
  await requireUser();
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  return { ok: true as const };
}

export async function isPushConfiguredAction() {
  await requireUser();
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}
