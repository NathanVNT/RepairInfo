import { NextRequest, NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * GET /api/produits
 * Récupère la liste des produits depuis Dolibarr
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '100';
    const sortfield = searchParams.get('sortfield') || 'ref';
    const sortorder = searchParams.get('sortorder') || 'ASC';
    
    const products = await dolibarrAPI.getProducts({
      limit: parseInt(limit),
      sortfield,
      sortorder
    });

    const normalizedProducts = Array.isArray(products)
      ? products.map((product: any) => ({
          ...product,
          price: toNumber(product.price, 0),
          price_ttc: toNumber(product.price_ttc, 0),
          price_min: toNumber(product.price_min, 0),
          tva_tx: toNumber(product.tva_tx, 0),
          stock_reel: toNumber(product.stock_reel, 0),
          stock_theorique: toNumber(product.stock_theorique, 0),
          seuil_stock_alerte: toNumber(product.seuil_stock_alerte, 0),
        }))
      : products;

    return NextResponse.json(normalizedProducts);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des produits Dolibarr:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des produits',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    );
  }
}

/**
 * POST /api/produits
 * Crée un nouveau produit dans Dolibarr
 */
export async function POST(request: NextRequest) {
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

    const created = await dolibarrAPI.createProduct(payload);
    const createdId =
      typeof created === 'number' || typeof created === 'string'
        ? String(created)
        : String((created as any)?.id || '');

    if (!createdId) {
      return NextResponse.json(created, { status: 201 });
    }

    const initialStock = toNumber(targetStock, 0);
    if (initialStock > 0) {
      try {
        const warehouseId = process.env.DOLIBARR_DEFAULT_WAREHOUSE_ID || '1';
        await dolibarrAPI.updateStock(createdId, warehouseId, initialStock, 1);
      } catch (stockError: any) {
        console.warn('Mouvement de stock initial impossible:', stockError.message);
      }
    }

    const newProduct = await dolibarrAPI.getProduct(createdId);

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error('Erreur lors de la création du produit:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la création du produit',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null,
      },
      { status: error.response?.status || 500 }
    );
  }
}
