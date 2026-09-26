"use server";

import { requireUser } from "@/lib/supabase/server";
import { db } from "@/db";
import { clients, services, workOrders, workOrderItems, retainers, retainerUsage, calendarEvents, interactionLogs, documentEvents, voiceLogs } from "@/db/schema";

interface BackupMetadata {
  exportedAt: string;
  schemaVersion: string;
  counts: {
    clients: number;
    services: number;
    workOrders: number;
    workOrderItems: number;
    retainers: number;
    retainerUsage: number;
    calendarEvents: number;
    interactionLogs: number;
    documentEvents: number;
    voiceLogs: number;
  };
}

interface BackupData {
  metadata: BackupMetadata;
  clients: unknown[];
  services: unknown[];
  workOrders: unknown[];
  workOrderItems: unknown[];
  retainers: unknown[];
  retainerUsage: unknown[];
  calendarEvents: unknown[];
  interactionLogs: unknown[];
  documentEvents: unknown[];
  voiceLogs: unknown[];
}

export async function exportBackupAction(): Promise<BackupData> {
  await requireUser();

  const [
    clientsData,
    servicesData,
    workOrdersData,
    workOrderItemsData,
    retainersData,
    retainerUsageData,
    calendarEventsData,
    interactionLogsData,
    documentEventsData,
    voiceLogsData,
  ] = await Promise.all([
    db.select().from(clients),
    db.select().from(services),
    db.select().from(workOrders),
    db.select().from(workOrderItems),
    db.select().from(retainers),
    db.select().from(retainerUsage),
    db.select().from(calendarEvents),
    db.select().from(interactionLogs),
    db.select().from(documentEvents),
    db.select().from(voiceLogs),
  ]);

  const metadata: BackupMetadata = {
    exportedAt: new Date().toISOString(),
    schemaVersion: "1.0",
    counts: {
      clients: clientsData.length,
      services: servicesData.length,
      workOrders: workOrdersData.length,
      workOrderItems: workOrderItemsData.length,
      retainers: retainersData.length,
      retainerUsage: retainerUsageData.length,
      calendarEvents: calendarEventsData.length,
      interactionLogs: interactionLogsData.length,
      documentEvents: documentEventsData.length,
      voiceLogs: voiceLogsData.length,
    },
  };

  return {
    metadata,
    clients: clientsData,
    services: servicesData,
    workOrders: workOrdersData,
    workOrderItems: workOrderItemsData,
    retainers: retainersData,
    retainerUsage: retainerUsageData,
    calendarEvents: calendarEventsData,
    interactionLogs: interactionLogsData,
    documentEvents: documentEventsData,
    voiceLogs: voiceLogsData,
  };
}
