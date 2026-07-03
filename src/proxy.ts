import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const signedInRedirectPaths = new Set([
  '/',
  '/login',
  '/register',
  '/sign-in',
  '/sign-up',
])

const protectedMarketingPaths = new Set([
  // '/saved',
  // '/contact',
  '/faq',
  // '/resources',
  // '/map',
])

function normalizePathname(pathname: string) {
  if (pathname !== '/' && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()
  const pathname = normalizePathname(request.nextUrl.pathname)

  if (userId && signedInRedirectPaths.has(pathname)) {
    return NextResponse.redirect(new URL('/contact', request.url))
  }

  if (!userId && protectedMarketingPaths.has(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Always run for Clerk-specific frontend API routes
    '/__clerk/:path*',
  ],
}
