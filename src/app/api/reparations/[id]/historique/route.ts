import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/reparations/[id]/historique - Ajouter une entrée à l'historique
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const historique = await prisma.reparationHistorique.create({
      data: {
        reparation_id: params.id,
        action: body.action,
        description: body.description,
        auteur: body.auteur,
        visible_client: body.visible_client ?? true,
      },
    });

    const formattedHistorique = {
      ...historique,
      date: historique.date.toISOString(),
    };

    return NextResponse.json(formattedHistorique, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de l'ajout à l'historique:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout à l'historique" },
      { status: 500 }
    );
  }
}
