import { NextRequest, NextResponse } from 'next/server';
import { getAuthSessionFromRequest } from '@/lib/auth-session';
import { listDolibarrApiUsers, DolibarrApiConfigError } from '@/lib/dolibarr-api-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = getAuthSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  try {
    if (!session.apiToken) {
      return NextResponse.json(
        {
          error: 'Session API incomplète. Reconnectez-vous.',
        },
        { status: 401 }
      );
    }

    const users = await listDolibarrApiUsers(session.apiToken, 200);
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Erreur lecture utilisateurs Dolibarr:', error);

    if (error instanceof DolibarrApiConfigError) {
      return NextResponse.json(
        {
          error: 'Configuration API Dolibarr incomplète',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
