import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dolibarrAPI } from '@/lib/dolibarr-api';

/**
 * POST /api/reparations/[id]/facture/sync-from-devis
 * Synchronise la facture avec les lignes du devis
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { facture_id, devis_id, auteur = 'Système' } = body;

    if (!facture_id || !devis_id) {
      return NextResponse.json(
        { error: 'IDs facture et devis manquants' },
        { status: 400 }
      );
    }

    // Récupérer le devis et ses lignes
    const devis = (await dolibarrAPI.getProposal(devis_id)) as any;
    if (!devis) {
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      );
    }

    const devisLines = devis.lines || [];

    // Récupérer la facture et ses lignes
    const facture = (await dolibarrAPI.getInvoice(facture_id)) as any;
    if (!facture) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    const factureLines = facture.lines || [];

    // Supprimer toutes les lignes actuelles de la facture (sauf la première qui est souvent le service)
    // On garde la première ligne (réparation) et on synchronise les pièces/lignes supplémentaires
    for (let i = factureLines.length - 1; i > 0; i--) {
      const line = factureLines[i];
      try {
        await dolibarrAPI.deleteInvoiceLine(String(facture_id), String(line.id || line.rowid));
      } catch (err) {
        console.warn(`⚠️ Impossible de supprimer la ligne ${line.id}:`, err);
      }
    }

    // Ajouter les lignes du devis (sauf la première si elle existe)
    for (let i = 1; i < devisLines.length; i++) {
      const line = devisLines[i];
      try {
        await dolibarrAPI.addInvoiceLine(String(facture_id), {
          fk_product: line.fk_product,
          desc: line.description || line.desc,
          subprice: line.subprice || line.pu,
          qty: line.qty,
          tva_tx: line.tva_tx || 20,
        });
      } catch (err) {
        console.warn(`⚠️ Impossible d'ajouter la ligne:`, err);
      }
    }

    console.log(`✅ Facture ${facture_id} synchronisée avec devis ${devis_id}`);

    // Ajouter à l'historique
    await prisma.reparationHistorique.create({
      data: {
        reparation_id: params.id,
        action: 'Facture synchronisée',
        description: `Facture mise à jour depuis le devis (ID: ${devis_id})`,
        auteur,
        visible_client: false,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Facture synchronisée avec succès' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Erreur synchronisation facture:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la synchronisation', message: error.message },
      { status: 500 }
    );
  }
}
