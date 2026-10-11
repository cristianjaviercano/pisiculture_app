import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/login', '/api'];
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get('erp_access')?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    const res = NextResponse.redirect(url);
    res.cookies.delete('erp_access');
    res.cookies.delete('erp_refresh');
    return res;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
