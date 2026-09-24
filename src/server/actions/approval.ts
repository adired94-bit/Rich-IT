"use server";

import { db } from "@/db";
import { workOrders, documentEvents } from "@/db/schema";
import { getWorkOrderByApprovalToken } from "@/server/queries/work-orders";
import { createServiceClient } from "@/lib/supabase/server";
import { sendPushToAll } from "@/lib/push";
import { company } from "@/config/company";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function markWorkOrderViewedAction(token: string) {
  const wo = await getWorkOrderByApprovalToken(token);
  if (!wo) return { ok: false as const };
  if (wo.status === "sent") {
    await db.update(workOrders).set({ status: "viewed", viewedAt: new Date() }).where(eq(workOrders.id, wo.id));
    await db.insert(documentEvents).values({ workOrderId: wo.id, event: "viewed" });
    revalidatePath(`/work-orders/${wo.id}`);
    await sendPushToAll({
      title: `${wo.client.name} צפה במסמך`,
      body: `${wo.number} · ${wo.title}`,
      url: `/work-orders/${wo.id}`,
    }).catch(() => {});
  }
  return { ok: true as const };
}

async function uploadSignature(workOrderId: string, dataUrl: string): Promise<string> {
  try {
    const supabase = createServiceClient();
    const base64 = dataUrl.split(",")[1] ?? "";
    const buffer = Buffer.from(base64, "base64");
    const path = `${workOrderId}/${Date.now()}.png`;
    const { error } = await supabase.storage.from("signatures").upload(path, buffer, { contentType: "image/png" });
    if (error) throw error;
    const { data } = await supabase.storage.from("signatures").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    return data?.signedUrl ?? dataUrl;
  } catch {
    // Storage not configured — embed the signature directly as a data URL. Still works end-to-end.
    return dataUrl;
  }
}

export async function signWorkOrderAction(token: string, signerName: string, signatureDataUrl: string) {
  const wo = await getWorkOrderByApprovalToken(token);
  if (!wo) return { ok: false as const, error: "not_found" as const };
  if (wo.status === "cancelled") return { ok: false as const, error: "cancelled" as const };
  if (wo.status === "signed") return { ok: false as const, error: "already_signed" as const };

  const signatureUrl = await uploadSignature(wo.id, signatureDataUrl);
  const signedAt = new Date();

  await db
    .update(workOrders)
    .set({ status: "signed", signatureUrl, signerName, signedAt })
    .where(eq(workOrders.id, wo.id));
  await db.insert(documentEvents).values({ workOrderId: wo.id, event: "signed", meta: { signerName } });

  revalidatePath(`/work-orders/${wo.id}`);
  revalidatePath("/work-orders");
  revalidatePath("/");
  await sendPushToAll({
    title: `${company.name} — נחתם דף שירות`,
    body: `${wo.number} נחתם על ידי ${signerName}`,
    url: `/work-orders/${wo.id}`,
  }).catch(() => {});
  return { ok: true as const };
}
