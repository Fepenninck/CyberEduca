import { NextRequest, NextResponse } from 'next/server'

const backendUrl =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3002'

export async function middleware(request: NextRequest) {
  const cookie = request.headers.get('cookie')
  if (!cookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const response = await fetch(new URL('/usuarios/me', backendUrl), {
      headers: { cookie },
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const usuario: unknown = await response.json()
    if (
      !usuario ||
      typeof usuario !== 'object' ||
      !('papel' in usuario) ||
      usuario.papel !== 'ADMIN'
    ) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
