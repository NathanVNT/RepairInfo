import { NextRequest, NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';
import { reparationService } from '@/lib/reparation-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/search-code
 * Recherche un code-barres/ref dans les produits ou réparations
 * Retourne { type: 'product'|'repair', id: string }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code')?.trim();

    if (!code) {
      return NextResponse.json(
        { error: 'Code vide' },
        { status: 400 }
      );
    }

    const normalizedCode = code.toLowerCase();

    try {
      const products = await dolibarrAPI.getProducts({ limit: 500 });
      
      if (Array.isArray(products)) {
        const found = products.find((p: any) => {
          const ref = (p.ref || '').toLowerCase();
          const barcode = (p.barcode || '').toLowerCase();
          return ref === normalizedCode || barcode === normalizedCode;
        });

        if (found) {
          return NextResponse.json({
            type: 'product',
            id: found.id,
            label: found.label,
            ref: found.ref,
          });
        }
      }
    } catch (error) {
      console.warn('Erreur recherche produits:', error);
    }

    try {
      const reparations = await reparationService.getReparations();

      const found = reparations.find((r: any) => {
        const ref = (r.ref || '').toLowerCase();
        return ref === normalizedCode;
      });

      if (found) {
        return NextResponse.json({
          type: 'repair',
          id: found.id,
          label: found.ref,
        });
      }
    } catch (error) {
      console.warn('Erreur recherche réparations:', error);
    }

    return NextResponse.json(
      { error: 'Code non trouvé', found: false },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Erreur recherche code:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la recherche',
        message: error.message || 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
