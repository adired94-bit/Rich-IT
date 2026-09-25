import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workOrders } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";
import { sendPushToAll } from "@/lib/push";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Morning digest push notification (Asia/Jerusalem ~08:00)
 * Focuses on unpaid items, especially done+unpaid (work completed but payment pending).
 * Secured with CRON_SECRET env var.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find signed work orders that are unpaid
    const unpaidOrders = await db.query.workOrders.findMany({
      where: and(eq(workOrders.status, "signed"), eq(workOrders.isPaid, false)),
      with: { client: { columns: { name: true } } },
      orderBy: (wo, { asc }) => [asc(wo.date)],
      limit: 20,
    });

    if (unpaidOrders.length === 0) {
      return NextResponse.json({ ok: true, message: "No unpaid work orders" });
    }

    // Count done+unpaid (high priority) vs not-done+unpaid
    const doneUnpaid = unpaidOrders.filter((wo) => wo.isCompleted).length;
    const notDoneUnpaid = unpaidOrders.filter((wo) => !wo.isCompleted).length;

    // Build message focusing on unpaid items, highlighting done+unpaid
    let title = "Rich IT — בוקר טוב";
    let body = "";
    
    if (doneUnpaid > 0 && notDoneUnpaid > 0) {
      body = `יש ${doneUnpaid} דפי שירות שבוצעו ולא שולמו, ועוד ${notDoneUnpaid} שטרם שולמו`;
    } else if (doneUnpaid > 0) {
      body = `יש ${doneUnpaid} דפי שירות שבוצעו וממתינים לתשלום`;
    } else {
      body = `יש ${notDoneUnpaid} דפי שירות שטרם שולמו`;
    }

    // Deep link to work orders - the main list will show unpaid items clearly
    await sendPushToAll({
      title,
      body,
      url: "/work-orders",
    });

    return NextResponse.json({
      ok: true,
      sent: true,
      doneUnpaid,
      notDoneUnpaid,
      totalUnpaid: unpaidOrders.length,
    });
  } catch (error) {
    console.error("[morning-digest] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
