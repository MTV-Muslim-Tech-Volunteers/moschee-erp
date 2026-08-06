import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Prüfen, ob das Auth-Cookie existiert
  const authCookie = request.cookies.get('gk_auth')

  // Wenn KEIN Cookie da ist, leite zur Login-Seite um
  if (!authCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/login' // Leitet den Nutzer hierhin um
    return NextResponse.redirect(url)
  }

  // Wenn das Cookie existiert, lass den Nutzer durch
  return NextResponse.next()
}

// Hier definieren wir, welche Seiten von dieser Regel geschützt werden sollen
export const config = {
  // Schützt /kitchen, /admin und alle Unterseiten davon
  matcher: ['/kitchen/:path*', '/admin/:path*'],
}