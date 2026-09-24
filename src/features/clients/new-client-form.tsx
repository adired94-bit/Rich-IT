"use client";
import { useRouter } from "next/navigation";
import { ClientForm } from "./client-form";
import { useTranslations } from "next-intl";

export function NewClientForm() {
  const router = useRouter();
  const t = useTranslations("clients");
  return (
    <ClientForm
      submitLabel={t("new")}
      onSuccess={(id) => {
        router.push(`/clients/${id}`);
      }}
    />
  );
}
