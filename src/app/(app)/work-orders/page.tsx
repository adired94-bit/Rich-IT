import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { listWorkOrders } from "@/server/queries/work-orders";
import { WorkOrdersList } from "@/features/work-orders/work-orders-list";

export default async function WorkOrdersPage() {
  const [t, rows] = await Promise.all([getTranslations("workOrders"), listWorkOrders()]);
  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <WorkOrdersList rows={rows} />
    </div>
  );
}
