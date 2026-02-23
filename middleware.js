import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

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
    (pathname.startsWith("/api/gallery/albums") && !pathname.startsWith("/api/gallery/albums/guest")) ||
    pathname.startsWith("/api/reminders") ||
    pathname.startsWith("/api/thankyou") ||
    pathname.startsWith("/api/export") ||
    pathname.startsWith("/api/host");

  if (isProtectedApi && !session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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
    "/api/rsvp/list/:path*",
    "/api/gallery/albums",
    "/api/gallery/albums/host/:path*",
    "/api/reminders/:path*",
    "/api/thankyou/:path*",
    "/api/export/:path*",
    "/api/host/:path*",
  ],
};
