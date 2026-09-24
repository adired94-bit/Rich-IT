import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { listServices } from "@/server/queries/catalog";
import { CatalogClient } from "@/features/catalog/catalog-client";

export default async function CatalogPage() {
  const [t, services] = await Promise.all([getTranslations("catalog"), listServices()]);
  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <CatalogClient services={services} />
    </div>
  );
}
