import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { NewWorkOrderForm } from "@/features/work-orders/new-work-order-form";
import { getCompanySettings } from "@/server/queries/settings";

export default async function NewWorkOrderPage() {
  const [t, company] = await Promise.all([getTranslations("workOrders"), getCompanySettings()]);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t("new")} />
      <NewWorkOrderForm company={company} />
    </div>
  );
}
