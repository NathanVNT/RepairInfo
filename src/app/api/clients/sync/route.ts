import { NextRequest, NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';

// POST /api/clients/sync - Créer ou synchroniser un client dans Dolibarr
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      name_alias,
      email,
      phone,
      address,
      zip,
      town,
      client_type = '1', // 1 = client, 2 = prospect, 3 = client et prospect
    } = body;

    // Créer le client dans Dolibarr
    const thirdPartyData = {
      name,
      name_alias,
      email,
      phone,
      address,
      zip,
      town,
      country_code: 'FR',
      client: client_type,
    };

    const thirdParty = await dolibarrAPI.createThirdParty(thirdPartyData);
    const clientId = (thirdParty as any).id || thirdParty;

    return NextResponse.json({
      success: true,
      client_id: clientId,
      message: 'Client créé avec succès dans Dolibarr',
    });
  } catch (error: any) {
    console.error('Erreur lors de la synchronisation du client:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la synchronisation du client', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/clients/sync?client_id=123 - Récupérer un client depuis Dolibarr
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    if (!clientId) {
      return NextResponse.json(
        { error: 'ID client manquant' },
        { status: 400 }
      );
    }

    const client = await dolibarrAPI.getThirdParty(clientId);

    return NextResponse.json(client);
  } catch (error) {
    console.error('Erreur lors de la récupération du client:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du client' },
      { status: 500 }
    );
  }
}
