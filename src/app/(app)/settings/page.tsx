import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsClient } from "@/features/settings/settings-client";
import { getCompanySettings, getAiKeysStatus } from "@/server/queries/settings";
import { icsFeedToken } from "@/lib/crypto";

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const [company, aiKeysStatus] = await Promise.all([getCompanySettings(), getAiKeysStatus()]);

  const status = {
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    database: Boolean(process.env.DATABASE_URL),
    vault: Boolean(process.env.VAULT_ENCRYPTION_KEY),
    push: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
  };

  const icsUrl = `${company.appUrl}/api/calendar/ics?token=${icsFeedToken()}`;
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <SettingsClient status={status} company={company} aiKeysStatus={aiKeysStatus} icsUrl={icsUrl} vapidPublicKey={vapidPublicKey} />
    </div>
  );
}
