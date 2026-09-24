import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getWorkOrder } from "@/server/queries/work-orders";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { WorkOrderPdfDocument } from "@/lib/pdf/work-order-document";
import { requireUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const workOrder = await getWorkOrder(id);
  if (!workOrder) return NextResponse.json({ error: "not_found" }, { status: 404 });

  registerPdfFonts();
  const buffer = await renderToBuffer(<WorkOrderPdfDocument workOrder={workOrder} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${workOrder.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
