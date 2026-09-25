import { NextResponse, type NextRequest } from "next/server";
import { listAllEventsForIcs } from "@/server/queries/calendar";
import { verifyIcsFeedToken } from "@/lib/crypto";
import { getCompanySettings } from "@/server/queries/settings";

function foldLine(line: string): string {
  // RFC 5545: fold lines longer than 75 octets with CRLF + leading space.
  if (line.length <= 75) return line;
  let result = "";
  let rest = line;
  let first = true;
  while (rest.length > 0) {
    const chunkSize = first ? 75 : 74;
    result += (first ? "" : "\r\n ") + rest.slice(0, chunkSize);
    rest = rest.slice(chunkSize);
    first = false;
  }
  return result;
}

function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!verifyIcsFeedToken(token)) {
    return NextResponse.json({ error: "Invalid or missing token" }, { status: 401 });
  }

  const [events, company] = await Promise.all([listAllEventsForIcs(), getCompanySettings()]);
  const now = toIcsDate(new Date());

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rich IT Solutions//CRM Calendar//HE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(company.name)}`,
    "X-WR-TIMEZONE:Asia/Jerusalem",
    "REFRESH-INTERVAL;VALUE=DURATION:PT15M",
  ];

  for (const e of events) {
    const summary = e.client ? `${e.title} — ${e.client.name}` : e.title;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@rich-it-solutions`,
      `DTSTAMP:${now}`,
      `DTSTART:${toIcsDate(new Date(e.startTime))}`,
      `DTEND:${toIcsDate(new Date(e.endTime))}`,
      `SUMMARY:${escapeText(summary)}`,
      ...(e.description ? [`DESCRIPTION:${escapeText(e.description)}`] : []),
      ...(e.location ? [`LOCATION:${escapeText(e.location)}`] : []),
      `STATUS:${e.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`,
      `CATEGORIES:${e.type.toUpperCase()}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");

  const body = lines.map(foldLine).join("\r\n") + "\r\n";

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="rich-it-calendar.ics"',
      "Cache-Control": "public, max-age=300",
    },
  });
}
