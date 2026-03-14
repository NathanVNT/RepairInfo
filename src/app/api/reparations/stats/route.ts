import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureReparationSchema } from '@/lib/reparation-schema';

// GET /api/reparations/stats - Récupérer les statistiques
export async function GET() {
  try {
    await ensureReparationSchema();
    const total = await prisma.reparation.count();
    const enCours = await prisma.reparation.count({
      where: {
        statut: {
          notIn: ['terminee', 'livree', 'annulee'],
        },
      },
    });

    // Réparations de la semaine
    const semaineDerniere = new Date();
    semaineDerniere.setDate(semaineDerniere.getDate() - 7);
    const semaine = await prisma.reparation.count({
      where: {
        date_depot: {
          gte: semaineDerniere,
        },
      },
    });

    // CA du mois
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const reparationsMois = await prisma.reparation.findMany({
      where: {
        date_fin: {
          gte: debutMois,
        },
        statut: {
          in: ['terminee', 'livree'],
        },
      },
      select: {
        montant_final: true,
      },
    });

    const caMois = reparationsMois.reduce(
      (sum: number, rep: any) => sum + (rep.montant_final || 0),
      0
    );

    return NextResponse.json({
      total,
      en_cours: enCours,
      semaine,
      ca_mois: caMois,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des stats' },
      { status: 500 }
    );
  }
}
