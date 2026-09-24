import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { NewClientForm } from "@/features/clients/new-client-form";

export default async function NewClientPage() {
  const t = await getTranslations("clients");
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("new")} />
      <Card>
        <CardContent className="pt-5">
          <NewClientForm />
        </CardContent>
      </Card>
    </div>
  );
}
