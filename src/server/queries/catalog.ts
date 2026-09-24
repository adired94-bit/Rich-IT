import "server-only";
import { db } from "@/db";
import { services } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function listServices() {
  return db.query.services.findMany({ orderBy: [asc(services.sortOrder), asc(services.titleHe)] });
}

export async function getService(id: string) {
  return db.query.services.findFirst({ where: eq(services.id, id) });
}

export async function listActiveServices() {
  return db.query.services.findMany({
    where: eq(services.active, true),
    orderBy: [asc(services.sortOrder), asc(services.titleHe)],
  });
}
