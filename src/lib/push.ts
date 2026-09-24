import "server-only";
import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

let configured = false;

function ensureConfigured(): boolean {
  const { NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!NEXT_PUBLIC_VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  if (!configured) {
    webpush.setVapidDetails(VAPID_SUBJECT || "mailto:info@rich-it.co.il", NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    configured = true;
  }
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Sends a push notification to every registered device. Silently no-ops if VAPID keys aren't configured. */
export async function sendPushToAll(payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;

  const subs = await db.query.pushSubscriptions.findMany();
  if (subs.length === 0) return;

  const body = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, body);
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Subscription expired or was revoked by the browser — clean it up.
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id)).catch(() => {});
        } else {
          console.warn("[push] delivery failed:", err);
        }
      }
    }),
  );
}
