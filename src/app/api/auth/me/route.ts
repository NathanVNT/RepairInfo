import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth-session';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = getAuthUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  return NextResponse.json({ user });
}
