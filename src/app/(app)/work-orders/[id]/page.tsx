import { notFound } from "next/navigation";
import { getWorkOrder } from "@/server/queries/work-orders";
import { WorkOrderDetail } from "@/features/work-orders/work-order-detail";

export default async function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workOrder = await getWorkOrder(id);
  if (!workOrder) notFound();
  return <WorkOrderDetail workOrder={workOrder} />;
}
