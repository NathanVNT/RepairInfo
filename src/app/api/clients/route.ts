import { NextRequest, NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';

/**
 * GET /api/clients
 * Récupère la liste des clients depuis Dolibarr
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '100';
    const sortfield = searchParams.get('sortfield') || 't.nom';
    const sortorder = searchParams.get('sortorder') || 'ASC';
    
    const clients = await dolibarrAPI.getThirdParties({
      limit: parseInt(limit),
      sortfield,
      sortorder,
      mode: 1 // 1 = clients uniquement
    });

    return NextResponse.json(clients);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des clients Dolibarr:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des clients',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    );
  }
}

/**
 * POST /api/clients
 * Crée un nouveau client dans Dolibarr
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newClient = await dolibarrAPI.createThirdParty(body);

    return NextResponse.json(newClient, { status: 201 });
  } catch (error: any) {
    console.error('Erreur lors de la création du client:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création du client',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    );
  }
}
