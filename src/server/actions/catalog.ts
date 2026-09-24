"use server";

import { db } from "@/db";
import { services } from "@/db/schema";
import { seedServices } from "@/db/seed-data";
import { serviceFormSchema, type ServiceFormValues } from "@/lib/validators/catalog";
import { listActiveServices } from "@/server/queries/catalog";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function fetchActiveServicesAction() {
  return listActiveServices();
}

function toKeywordsArray(input: string[] | string): string[] {
  if (Array.isArray(input)) return input.map((k) => k.trim()).filter(Boolean);
  return input
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

export async function upsertServiceAction(raw: ServiceFormValues) {
  const data = serviceFormSchema.parse(raw);
  const values = {
    category: data.category,
    sku: data.sku || null,
    titleHe: data.titleHe,
    titleRu: data.titleRu,
    descriptionHe: data.descriptionHe || null,
    descriptionRu: data.descriptionRu || null,
    keywords: toKeywordsArray(data.keywords),
    defaultPrice: data.defaultPrice,
    billingType: data.billingType,
    unit: data.unit,
    markupPercent: data.billingType === "hardware_markup" ? (data.markupPercent ?? 0) : null,
    includedHours: data.billingType === "retainer" ? (data.includedHours ?? 0) : null,
    active: data.active,
  };

  if (data.id) {
    await db.update(services).set(values).where(eq(services.id, data.id));
  } else {
    await db.insert(services).values(values);
  }
  revalidatePath("/catalog");
  return { ok: true as const };
}

export async function deleteServiceAction(id: string) {
  await db.delete(services).where(eq(services.id, id));
  revalidatePath("/catalog");
  return { ok: true as const };
}

export async function toggleServiceActiveAction(id: string, active: boolean) {
  await db.update(services).set({ active }).where(eq(services.id, id));
  revalidatePath("/catalog");
  return { ok: true as const };
}

export async function duplicateServiceAction(id: string) {
  const original = await db.query.services.findFirst({ where: eq(services.id, id) });
  if (!original) throw new Error("Service not found");
  const { id: _id, createdAt: _c, updatedAt: _u, sku, ...rest } = original;
  void _id;
  void _c;
  void _u;
  await db.insert(services).values({
    ...rest,
    sku: sku ? `${sku}-copy` : null,
    titleHe: `${original.titleHe} (עותק)`,
    titleRu: `${original.titleRu} (копия)`,
  });
  revalidatePath("/catalog");
  return { ok: true as const };
}

export async function seedCatalogAction() {
  let inserted = 0;
  for (const [i, s] of seedServices.entries()) {
    const res = await db
      .insert(services)
      .values({ ...s, sortOrder: i })
      .onConflictDoNothing({ target: services.sku })
      .returning({ id: services.id });
    if (res.length) inserted++;
  }
  revalidatePath("/catalog");
  revalidatePath("/settings");
  return { ok: true as const, inserted };
}

export async function reorderServicesAction(orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, index) =>
      db.update(services).set({ sortOrder: index }).where(eq(services.id, id)),
    ),
  );
  revalidatePath("/catalog");
  return { ok: true as const };
}
