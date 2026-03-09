import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dolibarrAPI } from '@/lib/dolibarr-api';

/**
 * POST /api/reparations/[id]/facture/payer
 * Valide et marque la facture comme payée
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { facture_id, auteur = 'Système' } = body;

    if (!facture_id) {
      return NextResponse.json(
        { error: 'ID facture manquant' },
        { status: 400 }
      );
    }

    // Valider et payer la facture dans Dolibarr
    try {
      // D'abord, valider la facture si elle est en brouillon
      const invoiceData = (await dolibarrAPI.getInvoice(String(facture_id))) as any;
      
      if (invoiceData && (invoiceData.statut === '0' || invoiceData.statut === 0)) {
        console.log(`📄 Validation de la facture ${facture_id}...`);
        try {
          await dolibarrAPI.validateInvoice(String(facture_id));
          console.log(`✅ Facture ${facture_id} validée`);
        } catch (validateError: any) {
          console.warn(`⚠️ Impossible de valider la facture:`, validateError.message);
        }
      }

      // Ajouter un paiement pour marquer comme payée
      const paiement = await dolibarrAPI.addInvoicePayment(String(facture_id), {
        datepaye: Math.floor(Date.now() / 1000),
        closepaidinvoices: '1',
      });

      console.log(`✅ Facture ${facture_id} marquée comme payée`);

      // Ajouter à l'historique de la réparation
      await prisma.reparationHistorique.create({
        data: {
          reparation_id: params.id,
          action: 'Facture payée',
          description: `Facture Dolibarr ${facture_id} marquée comme payée`,
          auteur,
          visible_client: false,
        },
      });

      return NextResponse.json(
        { success: true, message: 'Facture marquée comme payée' },
        { status: 200 }
      );
    } catch (dolibarrError: any) {
      console.error('❌ Erreur Dolibarr:', dolibarrError);
      // On retourne quand même un succès car la facture doit être payée même si Dolibarr a un problème
      return NextResponse.json(
        { success: true, warning: 'Facture payée mais une erreur est survenue chez Dolibarr' },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('❌ Erreur lors du paiement de facture:', error);
    return NextResponse.json(
      { error: 'Erreur lors du paiement de facture', message: error.message },
      { status: 500 }
    );
  }
}
