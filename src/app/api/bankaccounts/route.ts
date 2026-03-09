import { NextRequest, NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';

/**
 * GET /api/bankaccounts
 * Récupère la liste des comptes bancaires depuis Dolibarr
 */
export async function GET(request: NextRequest) {
  try {
    const accounts = await dolibarrAPI.getBankAccounts();

    return NextResponse.json(accounts);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des comptes bancaires:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des comptes bancaires',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null
      },
      { status: error.response?.status || 500 }
    );
  }
}
