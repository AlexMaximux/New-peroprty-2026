import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("pv_access_token")?.value
  const { pathname } = request.nextUrl

  // Define public paths
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register")
  const isStaticAsset = 
    pathname.startsWith("/_next") || 
    pathname.startsWith("/api") || 
    pathname.includes(".")

  console.log(`[Middleware] ${request.method} ${pathname} | isStatic: ${isStaticAsset} | isAuth: ${isAuthPage} | token: ${!!token}`)

  if (isStaticAsset) {
    return NextResponse.next()
  }

  // If redirecting to /login?clear=1, delete the cookie to break the infinite loop
  if (pathname === "/login" && request.nextUrl.searchParams.get("clear") === "1") {
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete("pv_access_token")
    return response
  }

  // If not logged in and trying to access a protected page, redirect to /login
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If logged in and trying to access login/register or the root /, redirect to /browse
  if (token && (isAuthPage || pathname === "/")) {
    return NextResponse.redirect(new URL("/browse", request.url))
  }

  // If not logged in and accessing root /, redirect to /login
  if (!token && pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
