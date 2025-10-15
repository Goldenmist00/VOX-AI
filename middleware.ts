import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/upload', '/forums', '/analysis']

// Routes that should redirect authenticated users
const authRoutes = ['/login', '/signup']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('vox-ai-auth')?.value || request.cookies.get('vox-ai-auth-debug')?.value

  console.log(`Middleware: ${pathname} - Token: ${token ? 'exists' : 'missing'}`)

  // Check if the route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Verify token if it exists
  let user = null
  if (token) {
    try {
      user = jwt.verify(token, JWT_SECRET) as any
      console.log(`Middleware: User verified - ${user.email} (${user.role})`)
    } catch (error) {
      console.log('Middleware: Token verification failed:', error)
      // Token is invalid, clear it
      const response = NextResponse.next()
      response.cookies.delete('vox-ai-auth')
      response.cookies.delete('vox-ai-auth-debug')
      return response
    }
  }

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users from auth routes
  if (isAuthRoute && user) {
    // Redirect based on user role
    if (user.role === 'ngo' || user.role === 'policymaker') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Special case: Dashboard access only for NGO/Policymaker
  if (pathname.startsWith('/dashboard') && user && !['ngo', 'policymaker'].includes(user.role)) {
    return NextResponse.redirect(new URL('/', request.url))
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
