import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = [
  "/login",
  "/approve",
  "/api/approve",
  "/api/calendar/ics",
  "/api/health",
  "/manifest.webmanifest",
  "/sw.js",
  "/icons",
  "/fonts",
  "/offline",
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Not configured yet (fresh checkout): let everything through so the setup screen is reachable.
  if (!url || !anon) return response;

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
      data: { user },
    } = await supabase.auth.getUser();

    const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

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
  } catch (err) {
    return new NextResponse(
      JSON.stringify(
        {
          diagnostic: "middleware-crash",
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : null,
        },
        null,
        2,
      ),
      { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
    );
  }
}
