import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateDolibarrApiWithPassword,
  DolibarrApiAuthUnavailableError,
  DolibarrApiConfigError,
} from '@/lib/dolibarr-api-auth';
import { AUTH_COOKIE_NAME, createSessionToken, getAuthCookieOptions } from '@/lib/auth-session';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = String(body?.identifier || '').trim();
    const password = String(body?.password || '');

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Identifiant et mot de passe requis' }, { status: 400 });
    }

    // API-only mode with username/password through Dolibarr login endpoint.
    const authResult = await authenticateDolibarrApiWithPassword(identifier, password);

    if (!authResult) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    const token = createSessionToken(authResult.user, authResult.apiToken);
    const response = NextResponse.json({ user: authResult.user });
    response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
    return response;
  } catch (error) {
    console.error('Erreur login Dolibarr:', error);

    if (error instanceof DolibarrApiConfigError) {
      return NextResponse.json(
        {
          error: 'Configuration API Dolibarr incomplète',
          hint: 'Configurez NEXT_PUBLIC_DOLIBARR_URL puis redémarrez le serveur Next.js.',
        },
        { status: 500 }
      );
    }

    if (error instanceof DolibarrApiAuthUnavailableError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 501 }
      );
    }

    if (error instanceof Error && error.message === 'Identifiants invalides') {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Erreur serveur lors de la connexion' }, { status: 500 });
  }
}
