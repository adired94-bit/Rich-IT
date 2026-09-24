import "server-only";
import { db } from "@/db";
import { clients, clientVault, retainers, retainerUsage, interactionLogs, workOrders, calendarEvents } from "@/db/schema";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";

export async function listClients() {
  const rows = await db
    .select({
      client: clients,
      openDocuments: sql<number>`count(distinct case when ${workOrders.status} in ('sent','viewed') then ${workOrders.id} end)`.mapWith(Number),
      totalBilled: sql<number>`coalesce(sum(case when ${workOrders.status} = 'signed' then ${workOrders.totalAmount} else 0 end), 0)`.mapWith(Number),
    })
    .from(clients)
    .leftJoin(workOrders, eq(workOrders.clientId, clients.id))
    .groupBy(clients.id)
    .orderBy(asc(clients.name));
  return rows;
}

export async function getClient(id: string) {
  return db.query.clients.findFirst({ where: eq(clients.id, id) });
}

export async function listClientsBasic() {
  return db.query.clients.findMany({ orderBy: [asc(clients.name)], columns: { id: true, name: true, phone: true, email: true, preferredLanguage: true } });
}

/** Vault rows without decrypted payload — safe to render in a list. */
export async function listVaultEntries(clientId: string) {
  return db.query.clientVault.findMany({
    where: eq(clientVault.clientId, clientId),
    orderBy: [desc(clientVault.createdAt)],
  });
}

export async function getVaultEntry(id: string) {
  return db.query.clientVault.findFirst({ where: eq(clientVault.id, id) });
}

export async function listRetainers(clientId: string) {
  const rows = await db.query.retainers.findMany({
    where: eq(retainers.clientId, clientId),
    orderBy: [desc(retainers.periodStart)],
  });
  const usageByRetainer = await Promise.all(
    rows.map(async (r) => {
      const [{ used } = { used: 0 }] = await db
        .select({ used: sql<number>`coalesce(sum(${retainerUsage.hours}), 0)`.mapWith(Number) })
        .from(retainerUsage)
        .where(eq(retainerUsage.retainerId, r.id));
      return { ...r, usedHours: used };
    }),
  );
  return usageByRetainer;
}

export async function listActiveRetainersAllClients() {
  const now = new Date();
  const rows = await db.query.retainers.findMany({
    where: and(eq(retainers.active, true), gte(retainers.periodEnd, now)),
    with: { client: true },
    orderBy: [asc(retainers.periodEnd)],
  });
  const withUsage = await Promise.all(
    rows.map(async (r) => {
      const [{ used } = { used: 0 }] = await db
        .select({ used: sql<number>`coalesce(sum(${retainerUsage.hours}), 0)`.mapWith(Number) })
        .from(retainerUsage)
        .where(eq(retainerUsage.retainerId, r.id));
      return { ...r, usedHours: used };
    }),
  );
  return withUsage;
}

export async function getRetainerUsageHistory(retainerId: string) {
  return db.query.retainerUsage.findMany({
    where: eq(retainerUsage.retainerId, retainerId),
    orderBy: [desc(retainerUsage.usedAt)],
  });
}

export async function listInteractions(clientId: string) {
  return db.query.interactionLogs.findMany({
    where: eq(interactionLogs.clientId, clientId),
    orderBy: [desc(interactionLogs.occurredAt)],
  });
}

export async function listClientEvents(clientId: string) {
  return db.query.calendarEvents.findMany({
    where: eq(calendarEvents.clientId, clientId),
    orderBy: [desc(calendarEvents.startTime)],
  });
}

export async function listClientWorkOrders(clientId: string) {
  return db.query.workOrders.findMany({
    where: eq(workOrders.clientId, clientId),
    orderBy: [desc(workOrders.date)],
  });
}

export async function getClientOverviewStats(clientId: string) {
  const [row] = await db
    .select({
      totalBilled: sql<number>`coalesce(sum(case when ${workOrders.status} = 'signed' then ${workOrders.totalAmount} else 0 end), 0)`.mapWith(Number),
      openDocuments: sql<number>`count(distinct case when ${workOrders.status} in ('sent','viewed') then ${workOrders.id} end)`.mapWith(Number),
    })
    .from(workOrders)
    .where(eq(workOrders.clientId, clientId));
  return row ?? { totalBilled: 0, openDocuments: 0 };
}
