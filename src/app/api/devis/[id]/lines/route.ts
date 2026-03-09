import { NextRequest, NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';

/**
 * POST /api/devis/[id]/lines
 * Ajoute une ligne à un devis
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const proposalId = params.id;
    
    const newLine = await dolibarrAPI.addProposalLine(proposalId, body);

    return NextResponse.json(newLine, { status: 201 });
  } catch (error: any) {
    console.error('Erreur lors de l\'ajout de la ligne:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'ajout de la ligne',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    );
  }
}
