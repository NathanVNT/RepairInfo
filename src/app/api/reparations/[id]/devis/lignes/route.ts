import { NextRequest, NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';

/**
 * GET /api/reparations/[id]/devis/lignes
 * Récupère les lignes d'un devis
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const devisId = searchParams.get('devisId');

    if (!devisId) {
      return NextResponse.json(
        { error: 'ID devis manquant' },
        { status: 400 }
      );
    }

    const proposal = await dolibarrAPI.getProposal(devisId);
    
    if (!proposal) {
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      );
    }

    const proposalData = proposal as any;

    return NextResponse.json({
      id: proposalData.id,
      ref: proposalData.ref,
      lines: proposalData.lines || [],
      total_ht: proposalData.total_ht,
      total_tva: proposalData.total_tva,
      total_ttc: proposalData.total_ttc,
    });
  } catch (error: any) {
    console.error('Erreur récupération lignes devis:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des lignes du devis', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/reparations/[id]/devis/lignes
 * Ajoute une ligne au devis
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { devisId, line } = body;

    if (!devisId || !line) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Ajouter la ligne au devis
    const newLine = await dolibarrAPI.addProposalLine(devisId, line);

    console.log(`✅ Ligne ajoutée au devis ${devisId}`);

    return NextResponse.json({
      success: true,
      line: newLine
    });
  } catch (error: any) {
    console.error('Erreur ajout ligne devis:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout de la ligne', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reparations/[id]/devis/lignes
 * Supprime une ligne du devis
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const devisId = searchParams.get('devisId');
    const lineId = searchParams.get('lineId');

    if (!devisId || !lineId) {
      return NextResponse.json(
        { error: 'IDs manquants' },
        { status: 400 }
      );
    }

    await dolibarrAPI.deleteProposalLine(devisId, lineId);

    console.log(`✅ Ligne ${lineId} supprimée du devis ${devisId}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur suppression ligne devis:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la ligne', message: error.message },
      { status: 500 }
    );
  }
}
