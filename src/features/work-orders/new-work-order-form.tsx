"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { WorkOrderEditor } from "./work-order-editor";
import type { CompanySettings } from "@/server/queries/settings";

export function NewWorkOrderForm({ company }: { company: CompanySettings }) {
  const router = useRouter();
  const params = useSearchParams();
  const clientId = params.get("clientId") ?? undefined;
  return (
    <WorkOrderEditor
      defaultClientId={clientId}
      company={company}
      onSaved={(id) => router.push(`/work-orders/${id}`)}
      onCancel={() => router.push("/work-orders")}
    />
  );
}
