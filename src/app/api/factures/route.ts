import { NextRequest, NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';

/**
 * GET /api/factures
 * Récupère la liste des factures depuis Dolibarr
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '100';
    const sortfield = searchParams.get('sortfield') || 't.datef';
    const sortorder = searchParams.get('sortorder') || 'DESC';
    const thirdparty_ids = searchParams.get('thirdparty_ids');
    const status = searchParams.get('status');
    
    const params: any = {
      limit: parseInt(limit),
      sortfield,
      sortorder
    };

    if (thirdparty_ids) {
      params.thirdparty_ids = thirdparty_ids;
    }

    if (status) {
      params.status = status;
    }

    const invoices = await dolibarrAPI.getInvoices(params);

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des factures Dolibarr:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des factures',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    );
  }
}

/**
 * POST /api/factures
 * Crée une nouvelle facture dans Dolibarr
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newInvoice = await dolibarrAPI.createInvoice(body);

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error: any) {
    console.error('Erreur lors de la création de la facture:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création de la facture',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    );
  }
}
