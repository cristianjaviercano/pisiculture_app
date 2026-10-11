import { cookies } from 'next/headers';
import { jwtVerify, type JWTPayload } from 'jose';
import type { TokenPayload } from './types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
);

export async function getSession(): Promise<TokenPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('erp_access')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<TokenPayload> {
  const session = await getSession();
  if (!session) throw new Error('UNAUTHENTICATED');
  return session;
}

export function can(session: TokenPayload, codigo: string): boolean {
  return session.permisos.includes(codigo);
}

export function hasModule(session: TokenPayload, modulo: string): boolean {
  return session.modulos.includes(modulo);
}

// Client-side: decode token from localStorage (set by login action)
export function decodeClientToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload as TokenPayload;
  } catch {
    return null;
  }
}
