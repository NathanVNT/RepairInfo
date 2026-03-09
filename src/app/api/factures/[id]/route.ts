import { NextRequest, NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';

/**
 * GET /api/factures/[id]
 * Récupère une facture par son ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    
    const invoice = await dolibarrAPI.getInvoice(invoiceId);

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error('Erreur lors de la récupération de la facture:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération de la facture',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    );
  }
}

/**
 * DELETE /api/factures/[id]
 * Supprime une facture (seulement en brouillon)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    
    await dolibarrAPI.deleteInvoice(invoiceId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur lors de la suppression de la facture:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la suppression de la facture',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    );
  }
}
