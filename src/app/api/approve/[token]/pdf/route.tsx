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
      // "attachment" (not "inline"): on mobile browsers, opening a PDF inline
      // hands off to the OS/browser's own viewer, whose UI varies wildly (on
      // some Android setups the only visible option is "Save to Drive," with
      // no obvious download button) — forcing a real download is consistent
      // everywhere and matches the button's "Download PDF" label.
      "Content-Disposition": `attachment; filename="${workOrder.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
