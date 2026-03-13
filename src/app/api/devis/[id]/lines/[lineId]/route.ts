import { NextRequest, NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; lineId: string } }
) {
  try {
    const body = await request.json();
    const updated = await dolibarrAPI.updateProposalLine(params.id, params.lineId, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Erreur mise a jour ligne devis:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la mise a jour de la ligne',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null,
      },
      { status: error.response?.status || 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; lineId: string } }
) {
  try {
    await dolibarrAPI.deleteProposalLine(params.id, params.lineId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur suppression ligne devis:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la suppression de la ligne',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null,
      },
      { status: error.response?.status || 500 }
    );
  }
}
