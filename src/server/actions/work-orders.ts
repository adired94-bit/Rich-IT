"use server";

import { db } from "@/db";
import { workOrders, workOrderItems, retainerUsage, interactionLogs, documentEvents } from "@/db/schema";
import { workOrderFormSchema, computeTotals, type WorkOrderFormValues } from "@/lib/validators/work-orders";
import { nextWorkOrderNumber } from "@/server/queries/work-orders";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function nullIfEmpty(v?: string | null) {
  return v && v.trim() !== "" ? v.trim() : null;
}

export async function upsertWorkOrderAction(raw: WorkOrderFormValues) {
  const data = workOrderFormSchema.parse(raw);
  const totals = computeTotals(data.items, data.discount, data.vatRate);

  const values = {
    clientId: data.clientId,
    date: new Date(data.date),
    title: data.title,
    summary: nullIfEmpty(data.summary),
    nextSteps: nullIfEmpty(data.nextSteps),
    internalNotes: nullIfEmpty(data.internalNotes),
    language: data.language,
    performerName: nullIfEmpty(data.performerName),
    timeSpentMinutes: data.timeSpentMinutes,
    discount: data.discount,
    vatRate: data.vatRate,
    subtotal: totals.subtotal,
    vatAmount: totals.vatAmount,
    totalAmount: totals.totalAmount,
    transcript: data.transcript ? data.transcript : undefined,
    aiResult: data.aiResult ? data.aiResult : undefined,
  };

  const isNew = !data.id;

  const id = await db.transaction(async (tx) => {
    let workOrderId = data.id;
    if (workOrderId) {
      await tx.update(workOrders).set(values).where(eq(workOrders.id, workOrderId));
      await tx.delete(workOrderItems).where(eq(workOrderItems.workOrderId, workOrderId));
    } else {
      const number = await nextWorkOrderNumber();
      const [row] = await tx
        .insert(workOrders)
        .values({ ...values, number, status: "draft" })
        .returning({ id: workOrders.id });
      workOrderId = row.id;
    }

    await tx.insert(workOrderItems).values(
      data.items.map((it, i) => ({
        workOrderId: workOrderId!,
        serviceId: it.serviceId || null,
        itemType: it.itemType,
        description: it.description,
        descriptionRu: nullIfEmpty(it.descriptionRu),
        quantity: it.quantity,
        unit: it.unit,
        unitPrice: it.unitPrice,
        discount: it.discount,
        total: Math.max(0, it.quantity * it.unitPrice - it.discount),
        sortOrder: i,
      })),
    );

    if (data.retainerId && data.retainerHours && data.retainerHours > 0) {
      const existing = await tx.query.retainerUsage.findFirst({ where: eq(retainerUsage.workOrderId, workOrderId) });
      if (existing) {
        await tx.update(retainerUsage).set({ hours: data.retainerHours, retainerId: data.retainerId }).where(eq(retainerUsage.id, existing.id));
      } else {
        await tx.insert(retainerUsage).values({
          retainerId: data.retainerId,
          workOrderId,
          hours: data.retainerHours,
          note: `${data.title} (${data.items.length > 0 ? "AI" : "manual"})`,
        });
      }
    }

    if (isNew) {
      await tx.insert(interactionLogs).values({
        clientId: data.clientId,
        type: "work_order",
        title: data.title,
        body: data.summary || null,
        workOrderId,
        occurredAt: new Date(data.date),
      });
      await tx.insert(documentEvents).values({ workOrderId, event: "created" });
    }

    return workOrderId;
  });

  revalidatePath("/work-orders");
  revalidatePath(`/work-orders/${id}`);
  revalidatePath(`/clients/${data.clientId}`);
  revalidatePath("/");
  return { ok: true as const, id };
}

export async function deleteWorkOrderAction(id: string, clientId?: string) {
  await db.delete(workOrders).where(eq(workOrders.id, id));
  revalidatePath("/work-orders");
  if (clientId) revalidatePath(`/clients/${clientId}`);
  return { ok: true as const };
}

export async function cancelWorkOrderAction(id: string) {
  await db.update(workOrders).set({ status: "cancelled" }).where(eq(workOrders.id, id));
  await db.insert(documentEvents).values({ workOrderId: id, event: "cancelled" });
  revalidatePath("/work-orders");
  revalidatePath(`/work-orders/${id}`);
  return { ok: true as const };
}

export async function markWorkOrderSentAction(id: string) {
  await db.update(workOrders).set({ status: "sent", sentAt: new Date() }).where(eq(workOrders.id, id));
  await db.insert(documentEvents).values({ workOrderId: id, event: "sent" });
  revalidatePath("/work-orders");
  revalidatePath(`/work-orders/${id}`);
  revalidatePath("/");
  return { ok: true as const };
}
