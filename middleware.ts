// middleware.ts
import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/utils/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

// Protected routes that only admins can access
const ADMIN_ROUTES = ["/update-prices", "/carriers"];

export async function middleware(request: NextRequest) {
  // Allow access to reset-password page without authentication
  if (
    request.nextUrl.pathname === "/reset-password" ||
    request.nextUrl.searchParams.has("token")
  ) {
    return NextResponse.next();
  }

  // Update session first
  const response = await updateSession(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Protect all routes except login
  if (!user && !request.nextUrl.pathname.startsWith("/login")) {
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect logged in users away from login page
  if (user && request.nextUrl.pathname.startsWith("/login")) {
    const redirectUrl = new URL("/", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Check role-based access for protected routes
  if (
    user &&
    ADMIN_ROUTES.some((route) => request.nextUrl.pathname.startsWith(route))
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const redirectUrl = new URL("/", request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
