import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { listClients } from "@/server/queries/clients";
import { ClientsDirectory } from "@/features/clients/clients-directory";

export default async function ClientsPage() {
  const [t, rows] = await Promise.all([getTranslations("clients"), listClients()]);
  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <ClientsDirectory rows={rows} />
    </div>
  );
}
