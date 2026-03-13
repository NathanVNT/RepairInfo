import { NextRequest, NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';

function normalizeNote(value: unknown): string {
  return String(value ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\r\n/g, '\n')
    .trim();
}

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
 * PUT /api/factures/[id]
 * Met a jour une facture (brouillon uniquement)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    const body = await request.json();

    const current: any = await dolibarrAPI.getInvoice(invoiceId);
    if (String(current?.statut || '') !== '0') {
      return NextResponse.json(
        { error: 'Seules les factures brouillon peuvent etre modifiees' },
        { status: 400 }
      );
    }

    const payload: Record<string, any> = {};

    if (typeof body?.note_public !== 'undefined') {
      payload.note_public = normalizeNote(body.note_public);
    }

    if (typeof body?.note_private !== 'undefined') {
      payload.note_private = normalizeNote(body.note_private);
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnee a mettre a jour' },
        { status: 400 }
      );
    }

    const updated = await dolibarrAPI.updateInvoice(invoiceId, payload);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Erreur lors de la mise a jour de la facture:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la mise a jour de la facture',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null,
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
