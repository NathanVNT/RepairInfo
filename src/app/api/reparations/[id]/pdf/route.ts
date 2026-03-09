import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/reparations/[id]/pdf
 * Génère un PDF d'accusé de réception avec QR code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reparation = await prisma.reparation.findUnique({
      where: { id: params.id },
    });

    if (!reparation) {
      return NextResponse.json(
        { error: 'Réparation non trouvée' },
        { status: 404 }
      );
    }

    // Retourner les données de la réparation pour générer le PDF côté client
    return NextResponse.json({
      id: reparation.id,
      ref: reparation.ref,
      client_name: reparation.client_name,
      appareil: reparation.appareil,
      marque: reparation.marque,
      modele: reparation.modele,
      numero_serie: reparation.numero_serie,
      description_panne: reparation.description_panne,
      date_depot: reparation.date_depot.toISOString(),
      montant_estime: reparation.montant_estime,
      note_client: reparation.note_client,
      statut: reparation.statut,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la réparation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la réparation' },
      { status: 500 }
    );
  }
}
