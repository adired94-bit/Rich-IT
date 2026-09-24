import { notFound } from "next/navigation";
import {
  getClient,
  listVaultEntries,
  listRetainers,
  listInteractions,
  listClientEvents,
  listClientWorkOrders,
  getClientOverviewStats,
} from "@/server/queries/clients";
import { ClientDetailView } from "@/features/clients/client-detail-view";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const [vault, retainerRows, interactions, events, workOrders, stats] = await Promise.all([
    listVaultEntries(id),
    listRetainers(id),
    listInteractions(id),
    listClientEvents(id),
    listClientWorkOrders(id),
    getClientOverviewStats(id),
  ]);

  return (
    <ClientDetailView
      client={client}
      vault={vault}
      retainers={retainerRows}
      interactions={interactions}
      events={events}
      workOrders={workOrders}
      stats={stats}
    />
  );
}
