import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin/* (but NOT /admin/login and NOT /api/admin/auth)
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";
  const isAuthApi = pathname === "/api/admin/auth";

  if (isAdminRoute && !isLoginPage && !isAuthApi) {
    const session = req.cookies.get("admin_session")?.value;
    if (session !== "1") {
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Also protect /api/admin/* except /api/admin/auth itself
  const isAdminApi = pathname.startsWith("/api/admin");
  if (isAdminApi && !isAuthApi) {
    const session = req.cookies.get("admin_session")?.value;
    if (session !== "1") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
