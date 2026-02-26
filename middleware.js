import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { checkRateLimit } from "./lib/rate-limit";

export async function middleware(request) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let session = null;
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    });
    const { data } = await supabase.auth.getSession();
    session = data?.session ?? null;
  }

  const { pathname } = request.nextUrl;

  // Protect /dashboard/* pages — redirect to login if not authenticated
  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect host API routes — return 401 if not authenticated
  const isProtectedApi =
    pathname.startsWith("/api/rsvp/list") ||
    pathname.startsWith("/api/rsvp/import") ||
    pathname.startsWith("/api/rsvp/template") ||
    (pathname.startsWith("/api/gallery/albums") && !pathname.startsWith("/api/gallery/albums/guest")) ||
    pathname.startsWith("/api/reminders") ||
    pathname.startsWith("/api/thankyou") ||
    pathname.startsWith("/api/export") ||
    pathname.startsWith("/api/host");

  if (isProtectedApi && !session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting for public endpoints
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (pathname === "/api/rsvp" && request.method === "POST") {
    const { limited, retryAfter } = await checkRateLimit("rsvp", ip);
    if (limited) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait before submitting again." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) },
        }
      );
    }
  }

  if (pathname === "/api/gallery/verify" && request.method === "POST") {
    const { limited, retryAfter } = await checkRateLimit("galleryVerify", ip);
    if (limited) {
      return new Response(
        JSON.stringify({ error: "Too many verification attempts. Please wait." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) },
        }
      );
    }
  }

  // Redirect authenticated users away from auth pages
  if (session && (pathname === "/auth/login" || pathname === "/auth/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/login",
    "/auth/register",
    "/api/rsvp",               // public RSVP submit — rate limited
    "/api/rsvp/list/:path*",
    "/api/rsvp/import",
    "/api/rsvp/template",
    "/api/gallery/verify",     // gallery OTP — rate limited
    "/api/gallery/albums",
    "/api/gallery/albums/host/:path*",
    "/api/reminders/:path*",
    "/api/thankyou/:path*",
    "/api/export/:path*",
    "/api/host/:path*",
  ],
};
