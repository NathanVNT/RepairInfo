import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseDateDepot(value?: string): Date {
  if (!value) return new Date();

  const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateOnlyRegex.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const now = new Date();
    return new Date(
      year,
      month - 1,
      day,
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds()
    );
  }

  return new Date(value);
}

// GET /api/reparations - Récupérer toutes les réparations avec filtres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');
    const client_id = searchParams.get('client_id');
    const technicien = searchParams.get('technicien');

    const where: any = {};
    if (statut) where.statut = statut;
    if (client_id) where.client_id = client_id;
    if (technicien) where.technicien = technicien;

    const reparations = await prisma.reparation.findMany({
      where,
      include: {
        historique: {
          orderBy: { date: 'desc' },
        },
        pieces_utilisees: true,
      },
      orderBy: { date_depot: 'desc' },
    });

    // Convertir les dates en ISO strings pour la sérialisation JSON
    const formattedReparations = reparations.map((rep: any) => ({
      ...rep,
      date_depot: rep.date_depot.toISOString(),
      date_prevue: rep.date_prevue?.toISOString(),
      date_fin: rep.date_fin?.toISOString(),
      historique: rep.historique.map((h: any) => ({
        ...h,
        date: h.date.toISOString(),
      })),
    }));

    return NextResponse.json(formattedReparations);
  } catch (error) {
    console.error('Erreur lors de la récupération des réparations:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des réparations' },
      { status: 500 }
    );
  }
}

// POST /api/reparations - Créer une nouvelle réparation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[API Reparations] Création avec data:', body);

    // Générer une référence unique
    const year = new Date().getFullYear();
    const count = await prisma.reparation.count();
    const ref = `REP-${year}-${String(count + 1).padStart(5, '0')}`;
    console.log('[API Reparations] Référence générée:', ref);

    // Créer la réparation avec l'historique initial
    const reparation: any = await prisma.reparation.create({
      data: {
        ref,
        client_id: body.client_id,
        client_name: body.client_name,
        appareil: body.appareil,
        marque: body.marque,
        modele: body.modele,
        numero_serie: body.numero_serie,
        description_panne: body.description_panne,
        date_depot: parseDateDepot(body.date_depot),
        date_prevue: body.date_prevue ? new Date(body.date_prevue) : null,
        statut: body.statut || 'en_attente',
        priorite: body.priorite || 'normale',
        montant_estime: body.montant_estime,
        technicien: body.technicien,
        note_interne: body.note_interne,
        note_client: body.note_client,
        historique: {
          create: {
            action: 'Création',
            description: 'Réparation créée',
            auteur: body.technicien || 'Système',
            visible_client: true,
          },
        },
      },
      include: {
        historique: true,
        pieces_utilisees: true,
      },
    } as any);

    // Compat runtime: certains processus gardent un client Prisma sans les nouveaux champs.
    // On persiste les préférences via SQL brut pour éviter l'erreur "Unknown argument".
    try {
      await prisma.$executeRawUnsafe(
        'UPDATE "Reparation" SET "notification_statut" = ?, "notification_documents" = ? WHERE "id" = ?',
        Boolean(body.notification_statut) ? 1 : 0,
        Boolean(body.notification_documents) ? 1 : 0,
        reparation.id
      );
    } catch (sqlError) {
      console.error('[API Reparations] Impossible de sauvegarder les notifications (SQL):', sqlError);
    }

    console.log('[API Reparations] Réparation créée:', reparation.id);

    // Formater les dates pour JSON
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

    return NextResponse.json(formattedReparation, { status: 201 });
  } catch (error: any) {
    console.error('[API Reparations] Erreur complète:', error);
    console.error('[API Reparations] Message:', error.message);
    console.error('[API Reparations] Stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création de la réparation',
        message: error.message,
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
