import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from '@/lib/auth-session';

export const runtime = 'nodejs';

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const baseCookieOptions = getAuthCookieOptions();
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    ...baseCookieOptions,
    maxAge: 0,
  });
  return response;
}
