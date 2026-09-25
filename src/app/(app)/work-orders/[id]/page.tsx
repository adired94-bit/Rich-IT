import { notFound } from "next/navigation";
import { getWorkOrder, listDocumentEvents } from "@/server/queries/work-orders";
import { WorkOrderDetail } from "@/features/work-orders/work-order-detail";
import { getCompanySettings } from "@/server/queries/settings";

export default async function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [workOrder, company] = await Promise.all([getWorkOrder(id), getCompanySettings()]);
  if (!workOrder) notFound();
  const events = await listDocumentEvents(id);
  const approvalUrl = `${company.appUrl}/approve/${workOrder.approvalToken}`;
  return <WorkOrderDetail workOrder={workOrder} events={events} approvalUrl={approvalUrl} company={company} />;
}
