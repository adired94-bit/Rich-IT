import "server-only";
import { db } from "@/db";
import { workOrders, workOrderItems } from "@/db/schema";
import { and, desc, eq, gte, ilike, or, sql } from "drizzle-orm";

export async function listWorkOrders(opts?: { status?: string; clientId?: string; search?: string; isPaid?: boolean }) {
  const conditions = [];
  if (opts?.status && opts.status !== "all") conditions.push(eq(workOrders.status, opts.status as (typeof workOrders.status.enumValues)[number]));
  if (opts?.clientId) conditions.push(eq(workOrders.clientId, opts.clientId));
  if (opts?.isPaid !== undefined) conditions.push(eq(workOrders.isPaid, opts.isPaid));
  if (opts?.search) {
    const q = `%${opts.search}%`;
    conditions.push(or(ilike(workOrders.number, q), ilike(workOrders.title, q)));
  }
  return db.query.workOrders.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: { client: { columns: { id: true, name: true, phone: true, preferredLanguage: true } } },
    orderBy: [desc(workOrders.date)],
  });
}

export async function getWorkOrder(id: string) {
  return db.query.workOrders.findFirst({
    where: eq(workOrders.id, id),
    with: {
      client: true,
      items: { orderBy: (items, { asc }) => [asc(items.sortOrder)] },
    },
  });
}

export async function listDocumentEvents(workOrderId: string) {
  return db.query.documentEvents.findMany({
    where: (events, { eq }) => eq(events.workOrderId, workOrderId),
    orderBy: (events, { asc }) => [asc(events.createdAt)],
  });
}

export async function getWorkOrderByApprovalToken(token: string) {
  return db.query.workOrders.findFirst({
    where: eq(workOrders.approvalToken, token),
    with: {
      client: true,
      items: { orderBy: (items, { asc }) => [asc(items.sortOrder)] },
    },
  });
}

export async function nextWorkOrderNumber(): Promise<string> {
  const result = await db.execute<{ next_work_order_number: string }>(sql`select next_work_order_number()`);
  return result[0].next_work_order_number;
}

export async function getDashboardStats() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [billedRow] = await db
    .select({ total: sql<number>`coalesce(sum(${workOrders.totalAmount}), 0)`.mapWith(Number) })
    .from(workOrders)
    .where(and(eq(workOrders.status, "signed"), gte(workOrders.signedAt, startOfMonth)));

  const [pendingRow] = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
      value: sql<number>`coalesce(sum(${workOrders.totalAmount}), 0)`.mapWith(Number),
    })
    .from(workOrders)
    .where(or(eq(workOrders.status, "sent"), eq(workOrders.status, "viewed")));

  const [signedThisMonthRow] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(workOrders)
    .where(and(eq(workOrders.status, "signed"), gte(workOrders.signedAt, startOfMonth)));

  return {
    billedThisMonth: billedRow?.total ?? 0,
    pendingCount: pendingRow?.count ?? 0,
    pendingValue: pendingRow?.value ?? 0,
    signedThisMonth: signedThisMonthRow?.count ?? 0,
  };
}

export async function listRecentWorkOrders(limit = 6) {
  return db.query.workOrders.findMany({
    with: { client: { columns: { id: true, name: true } } },
    orderBy: [desc(workOrders.createdAt)],
    limit,
  });
}

export async function getMonthlyRevenueTrend(months = 6) {
  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);
  since.setMonth(since.getMonth() - (months - 1));

  // Pass an ISO string rather than a raw Date: some serverless runtimes (e.g.
  // Netlify's) fail to serialize a Date instance as a postgres.js query
  // parameter ("Received an instance of Date") in a raw sql`` template.
  const rows = await db.execute<{ month: string; total: number }>(sql`
    select to_char(date_trunc('month', ${workOrders.signedAt}), 'YYYY-MM') as month,
           coalesce(sum(${workOrders.totalAmount}), 0)::float as total
    from ${workOrders}
    where ${workOrders.status} = 'signed' and ${workOrders.signedAt} >= ${since.toISOString()}
    group by 1
    order by 1
  `);
  return rows;
}

export type WorkOrderItemRow = typeof workOrderItems.$inferSelect;
