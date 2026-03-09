import { NextRequest, NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';

/**
 * POST /api/factures/[id]/payment
 * Enregistre un paiement pour une facture
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const invoiceId = params.id;
    
    console.log('[API Payment] Invoice ID:', invoiceId);
    console.log('[API Payment] Payment data:', body);
    
    const result = await dolibarrAPI.addInvoicePayment(invoiceId, body);

    console.log('[API Payment] Success:', result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API Payment] Erreur complète:', error);
    console.error('[API Payment] Response data:', error.response?.data);
    console.error('[API Payment] Response status:', error.response?.status);
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'enregistrement du paiement',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    );
  }
}
