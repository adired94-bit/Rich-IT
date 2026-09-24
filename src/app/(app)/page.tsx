import { PageHeader } from "@/components/shared/page-header";
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <p className="text-sm text-muted-foreground">בקרוב: מדדים פיננסיים, ריטיינרים ופעולות מהירות.</p>
    </div>
  );
}
