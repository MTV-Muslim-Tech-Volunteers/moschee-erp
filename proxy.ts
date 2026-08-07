import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Das .value am Ende ist wichtig, um den String ("role_admin" oder "role_finance") zu bekommen
  const authCookie = request.cookies.get('gk_auth')?.value
  const path = request.nextUrl.pathname

  // Routen-Gruppen definieren
  const financeRoutes = ['/kassenbuch', '/ausgaben']
  const adminRoutes = ['/produkte', '/kitchen']

  const isFinanceRoute = financeRoutes.some(route => path.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route))

  // Finanz-Seiten verlangen die Finance-Rolle
  if (isFinanceRoute && authCookie !== 'role_finance') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

 // Küchen/Produkte-Seiten verlangen die Admin- oder Finance-Rolle
  if (isAdminRoute && authCookie !== 'role_admin' && authCookie !== 'role_finance') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Das /admin Dashboard verlangt generell einen Login (egal welchen)
  if (path === '/admin' && !authCookie) {
     return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// Hier definieren wir, welche Seiten von dieser Regel geschützt werden sollen
export const config = {
  matcher: ['/kassenbuch/:path*', '/ausgaben/:path*', '/produkte/:path*', '/kitchen/:path*', '/admin'],
}