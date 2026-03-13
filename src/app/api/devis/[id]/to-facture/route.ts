import { NextRequest, NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';

function toNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? '0'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function pickInvoiceId(proposal: any): string | null {
  const candidates = [
    proposal?.fk_facture,
    proposal?.facture_id,
    proposal?.invoice_id,
    proposal?.fk_invoice,
  ];

  for (const item of candidates) {
    const id = String(item ?? '').trim();
    if (id && id !== '0' && id !== 'null' && id !== 'undefined') {
      return id;
    }
  }

  return null;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposalId = params.id;
    const proposal: any = await dolibarrAPI.getProposal(proposalId);

    if (!proposal) {
      return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 });
    }

    const existingInvoiceId = pickInvoiceId(proposal);
    if (existingInvoiceId) {
      return NextResponse.json({
        success: true,
        invoice_id: existingInvoiceId,
        already_billed: true,
      });
    }

    const socid = String(proposal?.socid || proposal?.fk_soc || '').trim();
    if (!socid) {
      return NextResponse.json(
        { error: 'Le devis ne contient pas de client (socid/fk_soc)' },
        { status: 400 }
      );
    }

    const invoiceData = {
      socid,
      type: 0,
      date: Math.floor(Date.now() / 1000),
      note_public: proposal?.note_public || `Facture creee depuis le devis ${proposal?.ref || proposalId}`,
      note_private: proposal?.note_private || '',
    };

    const createdInvoice = await dolibarrAPI.createInvoice(invoiceData);
    const invoiceId = String((createdInvoice as any)?.id ?? createdInvoice ?? '').trim();

    if (!invoiceId || invoiceId === 'undefined' || invoiceId === 'null') {
      throw new Error('ID facture Dolibarr invalide apres creation');
    }

    const lines: any[] = Array.isArray(proposal?.lines) ? proposal.lines : [];

    for (const line of lines) {
      await dolibarrAPI.addInvoiceLine(invoiceId, {
        fk_product: line?.fk_product || undefined,
        desc: line?.description || line?.desc || line?.product_label || '',
        subprice: toNumber(line?.subprice),
        qty: toNumber(line?.qty) || 1,
        tva_tx: toNumber(line?.tva_tx),
      });
    }

    return NextResponse.json({
      success: true,
      proposal_id: proposalId,
      invoice_id: invoiceId,
      lines_count: lines.length,
      already_billed: false,
    });
  } catch (error: any) {
    console.error('Erreur transformation devis en facture:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la transformation du devis en facture',
        message: error?.message || 'Erreur inconnue',
        details: error?.response?.data || null,
      },
      { status: error?.response?.status || 500 }
    );
  }
}
