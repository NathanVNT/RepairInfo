import { NextRequest, NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';

/**
 * POST /api/factures/[id]/validate
 * Valide une facture (passe du statut brouillon à validé)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    
    const result = await dolibarrAPI.validateInvoice(invoiceId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erreur lors de la validation de la facture:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la validation de la facture',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    );
  }
}
