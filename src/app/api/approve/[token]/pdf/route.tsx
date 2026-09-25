import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getWorkOrderByApprovalToken } from "@/server/queries/work-orders";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { WorkOrderPdfDocument } from "@/lib/pdf/work-order-document";
import { getCompanySettings } from "@/server/queries/settings";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [workOrder, company] = await Promise.all([getWorkOrderByApprovalToken(token), getCompanySettings()]);
  if (!workOrder || workOrder.status === "cancelled") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  registerPdfFonts();
  const buffer = await renderToBuffer(<WorkOrderPdfDocument workOrder={workOrder} company={company} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${workOrder.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
