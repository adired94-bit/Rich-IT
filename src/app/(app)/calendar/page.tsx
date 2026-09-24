import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { listClientsBasic } from "@/server/queries/clients";
import { CalendarClient } from "@/features/calendar/calendar-client";
import { icsFeedToken } from "@/lib/crypto";
import { company } from "@/config/company";

export default async function CalendarPage() {
  const [t, clients] = await Promise.all([getTranslations("calendar"), listClientsBasic()]);
  const icsUrl = `${company.appUrl}/api/calendar/ics?token=${icsFeedToken()}`;

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <CalendarClient clients={clients} icsUrl={icsUrl} />
    </div>
  );
}
