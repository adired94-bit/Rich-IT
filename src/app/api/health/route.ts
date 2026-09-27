import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { ok: true, service: "rich-it", ts: new Date().toISOString() },
    { status: 200 },
  );
}
