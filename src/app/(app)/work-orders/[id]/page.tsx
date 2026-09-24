import { notFound } from "next/navigation";
import { getWorkOrder, listDocumentEvents } from "@/server/queries/work-orders";
import { WorkOrderDetail } from "@/features/work-orders/work-order-detail";
import { company } from "@/config/company";

export default async function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workOrder = await getWorkOrder(id);
  if (!workOrder) notFound();
  const events = await listDocumentEvents(id);
  const approvalUrl = `${company.appUrl}/approve/${workOrder.approvalToken}`;
  return <WorkOrderDetail workOrder={workOrder} events={events} approvalUrl={approvalUrl} />;
}
