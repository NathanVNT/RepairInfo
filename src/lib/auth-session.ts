import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import type { AuthUser } from './auth-types';

export const AUTH_COOKIE_NAME = 'atelier_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h

type SessionPayload = {
  user: AuthUser;
  apiToken?: string;
  exp: number;
};

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET manquant en production');
    }
    return 'dev-only-auth-secret-change-me';
  }

  return secret;
}

function toBase64Url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function signPayload(payloadB64: string): string {
  return crypto.createHmac('sha256', getAuthSecret()).update(payloadB64).digest('base64url');
}

export function createSessionToken(user: AuthUser, apiToken?: string): string {
  const payload: SessionPayload = {
    user,
    apiToken,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const sig = signPayload(payloadB64);
  return `${payloadB64}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): AuthUser | null {
  const payload = getAuthSessionFromToken(token);
  return payload?.user || null;
}

function getAuthSessionFromToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;

  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return null;

  const expectedSignature = signPayload(payloadB64);
  if (signature.length !== expectedSignature.length) return null;
  const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  if (!valid) return null;

  try {
    const payload = JSON.parse(fromBase64Url(payloadB64)) as SessionPayload;

    if (!payload?.user || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export function getAuthUserFromRequest(request: NextRequest): AuthUser | null {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export function getAuthSessionFromRequest(request: NextRequest): { user: AuthUser; apiToken?: string } | null {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const payload = getAuthSessionFromToken(token);

  if (!payload) return null;
  return { user: payload.user, apiToken: payload.apiToken };
}

export function getAuthCookieOptions() {
  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || '').trim().toLowerCase();
  const shouldUseSecureCookie = process.env.NODE_ENV === 'production' && appUrl.startsWith('https://');

  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: shouldUseSecureCookie,
    path: '/',
    // Cookie de session: supprimé automatiquement à la fermeture du navigateur.
  };
}
