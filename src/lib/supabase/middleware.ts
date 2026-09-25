import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = [
  "/login",
  "/approve",
  "/api/approve",
  "/api/calendar/ics",
  "/api/health",
  "/api/cron",
  "/manifest.webmanifest",
  "/sw.js",
  "/icons",
  "/fonts",
  "/offline",
  "/robots.txt",
  "/sitemap.xml",
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Not configured yet (fresh checkout): let everything through so the setup screen is reachable.
  if (!url || !anon) return response;

  const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // If the Supabase session check itself fails (bad network, transient outage,
  // misconfiguration), fail closed to "not authenticated" rather than crashing
  // the whole request with a 500 — the user still gets a working /login page.
  let user: User | null = null;
  try {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    // Do not run code between createServerClient and auth.getUser() — cookies may be refreshed here.
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();
    user = sessionUser;
  } catch (err) {
    console.error("RICH_IT_MIDDLEWARE_AUTH_ERROR", err);
  }

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (user && pathname === "/login") {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    return NextResponse.redirect(home);
  }
  return response;
}
