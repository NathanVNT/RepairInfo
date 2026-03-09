import { NextRequest, NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';

/**
 * POST /api/devis/[id]/validate
 * Valide un devis (passe du statut brouillon à validé)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposalId = params.id;
    
    const result = await dolibarrAPI.validateProposal(proposalId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erreur lors de la validation du devis:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la validation du devis',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    );
  }
}
