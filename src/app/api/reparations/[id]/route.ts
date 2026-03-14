import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureReparationSchema } from '@/lib/reparation-schema';

function parseDateDepotForUpdate(value?: string): Date | undefined {
  if (!value) return undefined;

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

// GET /api/reparations/[id] - Récupérer une réparation par ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureReparationSchema();
    const reparation = await prisma.reparation.findUnique({
      where: { id: params.id },
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

    return NextResponse.json(formattedReparation);
  } catch (error) {
    console.error('Erreur lors de la récupération de la réparation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la réparation' },
      { status: 500 }
    );
  }
}

// PUT /api/reparations/[id] - Mettre à jour une réparation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureReparationSchema();
    const body = await request.json();

    const reparation: any = await prisma.reparation.update({
      where: { id: params.id },
      data: {
        client_id: body.client_id,
        client_name: body.client_name,
        appareil: body.appareil,
        marque: body.marque,
        modele: body.modele,
        numero_serie: body.numero_serie,
        description_panne: body.description_panne,
        date_depot: parseDateDepotForUpdate(body.date_depot),
        date_prevue: body.date_prevue ? new Date(body.date_prevue) : null,
        date_fin: body.date_fin ? new Date(body.date_fin) : null,
        statut: body.statut,
        priorite: body.priorite,
        montant_estime: body.montant_estime,
        montant_final: body.montant_final,
        technicien: body.technicien,
        facture_id: body.facture_id,
        devis_id: body.devis_id,
        note_interne: body.note_interne,
        note_client: body.note_client,
      },
      include: {
        historique: true,
        pieces_utilisees: true,
      },
    } as any);

    if (
      typeof body.notification_statut !== 'undefined' ||
      typeof body.notification_documents !== 'undefined'
    ) {
      try {
        const currentPrefs: any[] = await prisma.$queryRawUnsafe(
          'SELECT "notification_statut", "notification_documents" FROM "Reparation" WHERE "id" = ? LIMIT 1',
          params.id
        );

        const existing = currentPrefs?.[0] || {};
        const nextStatut =
          typeof body.notification_statut === 'undefined'
            ? Boolean(existing.notification_statut)
            : Boolean(body.notification_statut);
        const nextDocuments =
          typeof body.notification_documents === 'undefined'
            ? Boolean(existing.notification_documents)
            : Boolean(body.notification_documents);

        await prisma.$executeRawUnsafe(
          'UPDATE "Reparation" SET "notification_statut" = ?, "notification_documents" = ? WHERE "id" = ?',
          nextStatut ? 1 : 0,
          nextDocuments ? 1 : 0,
          params.id
        );
      } catch (sqlError) {
        console.error('[API Reparations] Impossible de mettre à jour les notifications (SQL):', sqlError);
      }
    }

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

    return NextResponse.json(formattedReparation);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réparation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la réparation' },
      { status: 500 }
    );
  }
}

// DELETE /api/reparations/[id] - Supprimer une réparation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureReparationSchema();
    await prisma.reparation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de la réparation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la réparation' },
      { status: 500 }
    );
  }
}
