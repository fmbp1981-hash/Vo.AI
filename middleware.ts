import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Protect all routes except auth routes
    if (req.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.next()
    }

    const token = (req as any).nextauth?.token ?? (req as any).auth?.token ?? (req as any).auth

    // Check if user is authenticated
    if (!token) {
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Admin-only areas
    const pathname = req.nextUrl.pathname
    const isAdminOnlyRoute = pathname.startsWith('/settings/integrations')
    const role = (token as any)?.role

    if (isAdminOnlyRoute && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (auth routes)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
}