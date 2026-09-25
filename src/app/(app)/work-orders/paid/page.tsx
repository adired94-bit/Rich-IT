import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { listWorkOrders } from "@/server/queries/work-orders";
import { WorkOrdersList } from "@/features/work-orders/work-orders-list";

export default async function PaidWorkOrdersPage() {
  const [t, rows] = await Promise.all([getTranslations("workOrders"), listWorkOrders({ isPaid: true })]);
  return (
    <div>
      <PageHeader title={t("paidFolder")} subtitle={t("paidFolderSubtitle")} />
      <WorkOrdersList rows={rows} />
    </div>
  );
}
