import { NextRequest, NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';

/**
 * GET /api/devis/[id]
 * Récupère un devis par son ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposalId = params.id;
    
    const proposal = await dolibarrAPI.getProposal(proposalId);

    return NextResponse.json(proposal);
  } catch (error: any) {
    console.error('Erreur lors de la récupération du devis:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération du devis',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    );
  }
}
