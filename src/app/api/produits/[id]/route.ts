import { NextRequest, NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeProduct = (product: any) => ({
  ...product,
  price: toNumber(product?.price, 0),
  price_ttc: toNumber(product?.price_ttc, 0),
  price_min: toNumber(product?.price_min, 0),
  tva_tx: toNumber(product?.tva_tx, 0),
  stock_reel: toNumber(product?.stock_reel, 0),
  stock_theorique: toNumber(product?.stock_theorique, 0),
  seuil_stock_alerte: toNumber(product?.seuil_stock_alerte, 0),
});

/**
 * GET /api/produits/[id]
 * Recupere un produit specifique depuis Dolibarr
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await dolibarrAPI.getProduct(params.id);
    return NextResponse.json(normalizeProduct(product));
  } catch (error: any) {
    console.error('Erreur lors de la recuperation du produit:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la recuperation du produit',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null,
      },
      { status: error.response?.status || 500 }
    );
  }
}

/**
 * PUT /api/produits/[id]
 * Met a jour un produit dans Dolibarr
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: 'Corps JSON invalide',
          message: 'Le JSON envoye est invalide.',
        },
        { status: 400 }
      );
    }

    const targetStock = body?.stock_reel;
    const payload = { ...body };
    delete payload.stock_reel;

    const currentProduct: any = await dolibarrAPI.getProduct(params.id);
    const currentStock = toNumber(currentProduct?.stock_reel, 0);

    const updatedProduct = await dolibarrAPI.updateProduct(params.id, payload);

    if (targetStock !== undefined && targetStock !== null) {
      const desiredStock = toNumber(targetStock, currentStock);
      const delta = desiredStock - currentStock;

      if (Math.abs(delta) > 0.001) {
        try {
          const warehouseId = process.env.DOLIBARR_DEFAULT_WAREHOUSE_ID || '1';
          const movementType = delta > 0 ? 1 : 0;
          await dolibarrAPI.updateStock(params.id, warehouseId, Math.abs(delta), movementType);
        } catch (stockError: any) {
          console.warn('Mouvement de stock impossible:', stockError.message);
        }
      }
    }

    if (typeof updatedProduct === 'object' && updatedProduct !== null) {
      const refreshed = await dolibarrAPI.getProduct(params.id);
      return NextResponse.json(normalizeProduct(refreshed));
    }

    const refreshed = await dolibarrAPI.getProduct(params.id);
    return NextResponse.json(normalizeProduct(refreshed));
  } catch (error: any) {
    console.error('Erreur lors de la mise a jour du produit:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la mise a jour du produit',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null,
      },
      { status: error.response?.status || 500 }
    );
  }
}

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
