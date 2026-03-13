import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dolibarrAPI } from '@/lib/dolibarr-api';
import { sendEmail } from '@/lib/email-service';
import { getRuntimeConfig } from '@/lib/runtime-config';
import { htmlToText, renderEmailTemplate } from '@/lib/email-templates';

const statutLabels: Record<string, string> = {
  en_attente: 'En attente',
  diagnostic: 'Diagnostic',
  en_reparation: 'En réparation',
  en_attente_piece: 'En attente pièce',
  terminee: 'Terminée',
  livree: 'Livrée',
  annulee: 'Annulée',
};

// POST /api/reparations/[id]/statut - Changer le statut d'une réparation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { statut, commentaire, auteur } = body;

    // Mettre à jour le statut
    const reparation: any = await prisma.reparation.update({
      where: { id: params.id },
      data: {
        statut,
        date_fin: statut === 'terminee' || statut === 'livree' ? new Date() : undefined,
      },
    });

    // Notification e-mail client (non bloquante)
    let notifyStatut = false;
    try {
      const prefs: any[] = await prisma.$queryRawUnsafe(
        'SELECT "notification_statut" FROM "Reparation" WHERE "id" = ? LIMIT 1',
        params.id
      );
      notifyStatut = Boolean(prefs?.[0]?.notification_statut);
    } catch (sqlError) {
      console.error('Erreur lecture préférence notification_statut:', sqlError);
    }

    if (notifyStatut) {
      try {
        const client = await dolibarrAPI.getThirdParty(reparation.client_id);
        const clientEmail = (client as any)?.email as string | undefined;
        const runtime = await getRuntimeConfig();
        const appName = runtime.appName || process.env.NEXT_PUBLIC_APP_NAME || 'Atelier Informatique';
        const appUrl = runtime.appUrl || process.env.NEXT_PUBLIC_APP_URL || '';
        const suiviUrl = appUrl ? `${appUrl}/suivi/${encodeURIComponent(reparation.ref)}` : '';

        if (clientEmail) {
          const statutLabel = statutLabels[statut] || statut;
          const subject = `[${appName}] Mise à jour de votre réparation ${reparation.ref}`;
          const html = await renderEmailTemplate('statut', {
            app_name: appName,
            client_name: reparation.client_name,
            repair_ref: reparation.ref,
            status_label: statutLabel,
            comment: commentaire || 'Aucun commentaire',
            tracking_url: suiviUrl || '#',
          });
          const text = htmlToText(html);

          await sendEmail({
            to: clientEmail,
            subject,
            text,
            html,
          });
        }
      } catch (notificationError) {
        console.error('Erreur notification e-mail statut:', notificationError);
      }
    }

    // Ajouter une entrée à l'historique
    await prisma.reparationHistorique.create({
      data: {
        reparation_id: params.id,
        action: 'Changement de statut',
        description: `Statut changé en "${statut}"${commentaire ? ` - ${commentaire}` : ''}`,
        auteur: auteur || 'Système',
        visible_client: true,
      },
    });

    // Récupérer la réparation complète mise à jour
    const updated = await prisma.reparation.findUnique({
      where: { id: params.id },
      include: {
        historique: {
          orderBy: { date: 'desc' },
        },
        pieces_utilisees: true,
      },
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Réparation non trouvée' },
        { status: 404 }
      );
    }

    // Formater les dates pour JSON
    const formattedReparation = {
      ...updated,
      date_depot: updated.date_depot.toISOString(),
      date_prevue: updated.date_prevue?.toISOString(),
      date_fin: updated.date_fin?.toISOString(),
      historique: updated.historique.map((h: any) => ({
        ...h,
        date: h.date.toISOString(),
      })),
    };

    return NextResponse.json(formattedReparation);
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    return NextResponse.json(
      { error: 'Erreur lors du changement de statut' },
      { status: 500 }
    );
  }
}
