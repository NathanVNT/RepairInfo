import { NextRequest, NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';

/**
 * GET /api/devis
 * Récupère la liste des devis (propositions commerciales) depuis Dolibarr
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '100';
    const sortfield = searchParams.get('sortfield') || 't.datep';
    const sortorder = searchParams.get('sortorder') || 'DESC';
    const thirdparty_ids = searchParams.get('thirdparty_ids');
    
    const params: any = {
      limit: parseInt(limit),
      sortfield,
      sortorder
    };

    if (thirdparty_ids) {
      params.thirdparty_ids = thirdparty_ids;
    }

    const proposals = await dolibarrAPI.getProposals(params);

    return NextResponse.json(proposals);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des devis Dolibarr:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des devis',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    );
  }
}

/**
 * POST /api/devis
 * Crée un nouveau devis dans Dolibarr
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newProposal = await dolibarrAPI.createProposal(body);

    return NextResponse.json(newProposal, { status: 201 });
  } catch (error: any) {
    console.error('Erreur lors de la création du devis:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création du devis',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    );
  }
}
