import { getWorkOrderByApprovalToken } from "@/server/queries/work-orders";
import { ApprovalView } from "@/features/approval/approval-view";
import { company } from "@/config/company";
import type { Metadata } from "next";

export const metadata: Metadata = { title: `אישור מסמך — ${company.name}` };

export default async function ApprovePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const workOrder = await getWorkOrderByApprovalToken(token);

  if (!workOrder) {
    return (
      <div dir="rtl" className="grid min-h-dvh place-items-center px-4">
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-base font-semibold text-foreground">המסמך לא נמצא</p>
          <p className="mt-1 text-sm text-muted-foreground">הקישור אינו תקין או שהמסמך הוסר.</p>
        </div>
      </div>
    );
  }

  return <ApprovalView workOrder={workOrder} token={token} />;
}
