import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { listWorkOrders } from "@/server/queries/work-orders";
import { WorkOrdersList, type WorkOrdersView } from "@/features/work-orders/work-orders-list";

const VIEWS: WorkOrdersView[] = ["pending", "signed-month"];

export default async function WorkOrdersPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const [t, rows, params] = await Promise.all([getTranslations("workOrders"), listWorkOrders(), searchParams]);
  const initialView = VIEWS.find((v) => v === params.view) ?? null;
  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <WorkOrdersList rows={rows} initialView={initialView} />
    </div>
  );
}
