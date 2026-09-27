"use server";

import { db } from "@/db";
import { clients, clientVault, retainers, retainerUsage, interactionLogs, workOrders } from "@/db/schema";
import { listRetainers, listClientsBasic } from "@/server/queries/clients";
import { clientFormSchema, vaultFormSchema, retainerFormSchema, retainerUsageSchema, interactionFormSchema, type VaultPayload } from "@/lib/validators/clients";
import { encryptJson, decryptJson } from "@/lib/crypto";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function nullIfEmpty(v?: string | null) {
  return v && v.trim() !== "" ? v.trim() : null;
}

/* ------------------------------ Clients ------------------------------ */

export async function upsertClientAction(raw: z.infer<typeof clientFormSchema>) {
  const data = clientFormSchema.parse(raw);
  const values = {
    name: data.name,
    contactPerson: nullIfEmpty(data.contactPerson),
    phone: nullIfEmpty(data.phone),
    email: nullIfEmpty(data.email),
    address: nullIfEmpty(data.address),
    notes: nullIfEmpty(data.notes),
    slaLevel: data.slaLevel,
    status: data.status,
    preferredLanguage: data.preferredLanguage,
    hourlyRate: data.hourlyRate ?? null,
    billingInfo: {
      vatId: nullIfEmpty(data.vatId) ?? undefined,
      billingEmail: nullIfEmpty(data.billingEmail) ?? undefined,
      paymentTerms: nullIfEmpty(data.paymentTerms) ?? undefined,
    },
    tags: data.tags,
  };

  let id = data.id;
  if (id) {
    await db.update(clients).set(values).where(eq(clients.id, id));
  } else {
    const [row] = await db.insert(clients).values(values).returning({ id: clients.id });
    id = row.id;
  }
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { ok: true as const, id: id! };
}

/**
 * work_orders.client_id is ON DELETE RESTRICT on purpose: documents that were
 * sent to or signed by a client are business/tax records and must survive the
 * client's deletion. Drafts and cancelled documents are not, so they are
 * removed together with the client; anything else blocks the delete and the
 * UI offers archiving (status "inactive") instead.
 */
export async function deleteClientAction(id: string) {
  const docs = await db.query.workOrders.findMany({
    where: eq(workOrders.clientId, id),
    columns: { id: true, status: true },
  });
  const kept = docs.filter((d) => d.status !== "draft" && d.status !== "cancelled");
  if (kept.length > 0) {
    return { ok: false as const, error: "has_documents" as const, count: kept.length };
  }

  await db.transaction(async (tx) => {
    if (docs.length > 0) {
      await tx.delete(workOrders).where(and(eq(workOrders.clientId, id), inArray(workOrders.status, ["draft", "cancelled"])));
    }
    await tx.delete(clients).where(eq(clients.id, id));
  });
  revalidatePath("/clients");
  revalidatePath("/work-orders");
  revalidatePath("/");
  return { ok: true as const };
}

export async function archiveClientAction(id: string) {
  await db.update(clients).set({ status: "inactive" }).where(eq(clients.id, id));
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { ok: true as const };
}

/* ------------------------------- Vault -------------------------------- */

export async function upsertVaultEntryAction(raw: z.infer<typeof vaultFormSchema>) {
  const data = vaultFormSchema.parse(raw);
  const payload: VaultPayload = {
    host: nullIfEmpty(data.host) ?? undefined,
    username: nullIfEmpty(data.username) ?? undefined,
    password: nullIfEmpty(data.password) ?? undefined,
    url: nullIfEmpty(data.url) ?? undefined,
    notes: nullIfEmpty(data.notes) ?? undefined,
  };
  const encryptedData = encryptJson(payload);

  if (data.id) {
    await db.update(clientVault).set({ title: data.title, category: data.category, encryptedData }).where(eq(clientVault.id, data.id));
  } else {
    await db.insert(clientVault).values({ clientId: data.clientId, title: data.title, category: data.category, encryptedData });
  }
  revalidatePath(`/clients/${data.clientId}`);
  return { ok: true as const };
}

export async function deleteVaultEntryAction(id: string, clientId: string) {
  await db.delete(clientVault).where(eq(clientVault.id, id));
  revalidatePath(`/clients/${clientId}`);
  return { ok: true as const };
}

/** Decrypts a single vault entry on demand. Never called eagerly for lists. */
export async function revealVaultEntryAction(id: string): Promise<VaultPayload> {
  const entry = await db.query.clientVault.findFirst({ where: eq(clientVault.id, id) });
  if (!entry) throw new Error("Vault entry not found");
  return decryptJson<VaultPayload>(entry.encryptedData);
}

/* ------------------------------ Retainers ------------------------------ */

export async function upsertRetainerAction(raw: z.infer<typeof retainerFormSchema>) {
  const data = retainerFormSchema.parse(raw);
  const values = {
    clientId: data.clientId,
    title: data.title,
    totalHours: data.totalHours,
    monthlyFee: data.monthlyFee,
    overageRate: data.overageRate ?? null,
    periodStart: new Date(data.periodStart),
    periodEnd: new Date(data.periodEnd),
    active: data.active,
  };
  if (data.id) {
    await db.update(retainers).set(values).where(eq(retainers.id, data.id));
  } else {
    await db.insert(retainers).values(values);
  }
  revalidatePath(`/clients/${data.clientId}`);
  return { ok: true as const };
}

export async function deleteRetainerAction(id: string, clientId: string) {
  await db.delete(retainers).where(eq(retainers.id, id));
  revalidatePath(`/clients/${clientId}`);
  return { ok: true as const };
}

export async function logRetainerUsageAction(raw: z.infer<typeof retainerUsageSchema>, clientId: string) {
  const data = retainerUsageSchema.parse(raw);
  await db.insert(retainerUsage).values({ retainerId: data.retainerId, hours: data.hours, note: nullIfEmpty(data.note) });
  revalidatePath(`/clients/${clientId}`);
  return { ok: true as const };
}

/* ----------------------------- Interactions ----------------------------- */

export async function addInteractionAction(raw: z.infer<typeof interactionFormSchema>) {
  const data = interactionFormSchema.parse(raw);
  await db.insert(interactionLogs).values({
    clientId: data.clientId,
    type: data.type,
    title: data.title,
    body: nullIfEmpty(data.body),
    occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
  });
  revalidatePath(`/clients/${data.clientId}`);
  return { ok: true as const };
}

export async function deleteInteractionAction(id: string, clientId: string) {
  await db.delete(interactionLogs).where(eq(interactionLogs.id, id));
  revalidatePath(`/clients/${clientId}`);
  return { ok: true as const };
}

/* ------------------------ Cross-feature helpers ------------------------ */

/** Active retainers for a client, used by the work-order editor's hour-bank picker. */
export async function fetchActiveRetainersAction(clientId: string) {
  const rows = await listRetainers(clientId);
  return rows.filter((r) => r.active);
}

export async function fetchClientsBasicAction() {
  return listClientsBasic();
}
