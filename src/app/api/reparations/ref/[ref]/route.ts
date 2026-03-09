import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/reparations/ref/[ref] - Récupérer une réparation par référence
export async function GET(
  request: Request,
  { params }: { params: { ref: string } }
) {
  try {
    const ref = decodeURIComponent(params.ref);

    const reparation = await prisma.reparation.findUnique({
      where: { ref },
      include: {
        historique: {
          orderBy: { date: 'desc' },
        },
        pieces_utilisees: true,
      },
    });

    if (!reparation) {
      return NextResponse.json(
        { error: 'Réparation non trouvée' },
        { status: 404 }
      );
    }

    const formattedReparation = {
      ...reparation,
      date_depot: reparation.date_depot.toISOString(),
      date_prevue: reparation.date_prevue?.toISOString(),
      date_fin: reparation.date_fin?.toISOString(),
      historique: reparation.historique.map((h: any) => ({
        ...h,
        date: h.date.toISOString(),
      })),
    };

    return NextResponse.json(formattedReparation);
  } catch (error) {
    console.error('Erreur lors de la récupération de la réparation par référence:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la réparation' },
      { status: 500 }
    );
  }
}
