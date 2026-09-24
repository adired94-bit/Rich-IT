"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { WorkOrderEditor } from "./work-order-editor";

export function NewWorkOrderForm() {
  const router = useRouter();
  const params = useSearchParams();
  const clientId = params.get("clientId") ?? undefined;
  return (
    <WorkOrderEditor
      defaultClientId={clientId}
      onSaved={(id) => router.push(`/work-orders/${id}`)}
      onCancel={() => router.push("/work-orders")}
    />
  );
}
