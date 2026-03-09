import { NextRequest, NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';

/**
 * GET /api/clients/[id]
 * Récupère un client spécifique depuis Dolibarr
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await dolibarrAPI.getThirdParty(params.id);

    return NextResponse.json(client);
  } catch (error: any) {
    console.error('Erreur lors de la récupération du client:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération du client',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    );
  }
}

/**
 * PUT /api/clients/[id]
 * Met à jour un client dans Dolibarr
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const updatedClient = await dolibarrAPI.updateThirdParty(params.id, body);

    return NextResponse.json(updatedClient);
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du client:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la mise à jour du client',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    );
  }
}
