import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { getUserAccessStatus, type UserAccessStatus } from './lib/airtable'

const ACCESS_STATUS_PATH = '/access-status'
const APPROVED_REDIRECT_PATH = '/contact'
const SIGN_IN_PATH = '/login'

const signedInRedirectPaths = new Set([
  '/login',
  '/register',
  '/sign-in',
  '/sign-up',
])

const signedOutPublicPagePaths = new Set([
  '/',
  ...signedInRedirectPaths,
])

function normalizePathname(pathname: string) {
  if (pathname !== '/' && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname
}

function isPagePath(pathname: string) {
  return (
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/trpc') &&
    !pathname.startsWith('/__clerk')
  )
}

function getAccessStatusUrl(status: Exclude<UserAccessStatus, 'approved'>, requestUrl: string) {
  const url = new URL(ACCESS_STATUS_PATH, requestUrl)
  url.searchParams.set('access', status)
  return url
}

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()
  const pathname = normalizePathname(request.nextUrl.pathname)

  if (!isPagePath(pathname)) {
    return
  }

  if (!userId) {
    if (!signedOutPublicPagePaths.has(pathname)) {
      return NextResponse.redirect(new URL(SIGN_IN_PATH, request.url))
    }

    return
  }

  const accessStatus = await getUserAccessStatus(userId)
  console.log(accessStatus)

  if (accessStatus !== 'approved') {
    if (pathname === '/') {
      return
    }

    if (pathname === ACCESS_STATUS_PATH) {
      if (request.nextUrl.searchParams.get('access') !== accessStatus) {
        return NextResponse.redirect(getAccessStatusUrl(accessStatus, request.url))
      }

      return
    }

    return NextResponse.redirect(getAccessStatusUrl(accessStatus, request.url))
  }

  if (signedInRedirectPaths.has(pathname) || pathname === ACCESS_STATUS_PATH) {
    return NextResponse.redirect(new URL(APPROVED_REDIRECT_PATH, request.url))
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
