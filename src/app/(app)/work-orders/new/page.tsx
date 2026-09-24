import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { NewWorkOrderForm } from "@/features/work-orders/new-work-order-form";

export default async function NewWorkOrderPage() {
  const t = await getTranslations("workOrders");
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t("new")} />
      <NewWorkOrderForm />
    </div>
  );
}
