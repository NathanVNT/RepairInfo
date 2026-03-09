import { NextRequest, NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';

/**
 * DELETE /api/produits/[id]
 * Supprime un produit dans Dolibarr
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dolibarrAPI.deleteProduct(params.id);

    return NextResponse.json(
      { message: 'Produit supprime avec succes' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la suppression du produit:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la suppression du produit',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null,
      },
      { status: error.response?.status || 500 }
    );
  }
}
