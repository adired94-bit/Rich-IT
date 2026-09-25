import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workOrders } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";
import { sendPushToAll } from "@/lib/push";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Morning digest push notification (Asia/Jerusalem ~08:00)
 * Sends a summary of unpaid and/or incomplete work orders.
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
    // Find work orders that are not completed OR not paid (excluding drafts and cancelled)
    const pendingOrders = await db.query.workOrders.findMany({
      where: and(
        or(eq(workOrders.status, "sent"), eq(workOrders.status, "viewed"), eq(workOrders.status, "signed")),
        or(eq(workOrders.isCompleted, false), eq(workOrders.isPaid, false))
      ),
      with: { client: { columns: { name: true } } },
      orderBy: (wo, { asc }) => [asc(wo.date)],
      limit: 10,
    });

    if (pendingOrders.length === 0) {
      return NextResponse.json({ ok: true, message: "No pending work orders" });
    }

    const notCompleted = pendingOrders.filter((wo) => !wo.isCompleted).length;
    const notPaid = pendingOrders.filter((wo) => !wo.isPaid).length;

    // Build message based on what's pending
    let title = "Rich IT — בוקר טוב";
    let body = "";
    
    if (notCompleted > 0 && notPaid > 0) {
      body = `יש ${notCompleted} דפי שירות שטרם בוצעו ו-${notPaid} שטרם שולמו`;
    } else if (notCompleted > 0) {
      body = `יש ${notCompleted} דפי שירות שטרם בוצעו`;
    } else if (notPaid > 0) {
      body = `יש ${notPaid} דפי שירות שטרם שולמו`;
    }

    // Send push notification with deep link to work orders page
    await sendPushToAll({
      title,
      body,
      url: "/work-orders",
    });

    return NextResponse.json({
      ok: true,
      sent: true,
      notCompleted,
      notPaid,
      total: pendingOrders.length,
    });
  } catch (error) {
    console.error("[morning-digest] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
