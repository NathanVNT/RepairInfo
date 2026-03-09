import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dolibarrAPI } from '@/lib/dolibarr-api';
import { sendEmail } from '@/lib/email-service';

// POST /api/reparations/[id]/devis - Créer un devis Dolibarr depuis une réparation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { duree_validite = 30 } = body; // Durée de validité en jours

    // Récupérer la réparation
    const reparation: any = await prisma.reparation.findUnique({
      where: { id: params.id },
      include: {
        pieces_utilisees: true,
      },
    });

    if (!reparation) {
      return NextResponse.json(
        { error: 'Réparation non trouvée' },
        { status: 404 }
      );
    }

    // Calculer la date de fin de validité
    const now = Math.floor(Date.now() / 1000);
    const finValidite = now + (duree_validite * 24 * 60 * 60);

    // Créer le devis dans Dolibarr
    const proposalData = {
      socid: reparation.client_id,
      date: now,
      fin_validite: finValidite,
      note_public: `Devis pour réparation ${reparation.ref}\n${reparation.appareil} - ${reparation.marque || ''} ${reparation.modele || ''}\n\nPanne: ${reparation.description_panne}`,
      note_private: reparation.note_interne || '',
    };

    const proposal = await dolibarrAPI.createProposal(proposalData);
    const proposalIdRaw = (proposal as any)?.id ?? proposal;
    const proposalId = String(proposalIdRaw);

    if (!proposalId || proposalId === 'undefined' || proposalId === 'null') {
      throw new Error('ID devis Dolibarr invalide après création');
    }

    // Ajouter les lignes du devis
    // Ligne principale : Diagnostic et réparation
    await dolibarrAPI.addProposalLine(proposalId, {
      desc: `Diagnostic et réparation ${reparation.appareil}\n${reparation.description_panne}`,
      subprice: reparation.montant_estime || 0,
      qty: 1,
      tva_tx: 20, // 20% TVA par défaut
    });

    // Ajouter les pièces prévues comme lignes
    if (reparation.pieces_utilisees && reparation.pieces_utilisees.length > 0) {
      for (const piece of reparation.pieces_utilisees) {
        await dolibarrAPI.addProposalLine(proposalId, {
          fk_product: piece.product_id,
          desc: piece.product_label,
          subprice: piece.prix_unitaire,
          qty: piece.quantite,
          tva_tx: 20,
        });
      }
    }

    // Mettre à jour la réparation avec l'ID du devis
    await prisma.reparation.update({
      where: { id: params.id },
      data: { devis_id: proposalId },
    });

    // Ajouter à l'historique
    await prisma.reparationHistorique.create({
      data: {
        reparation_id: params.id,
        action: 'Devis créé',
        description: `Devis Dolibarr créé (ID: ${proposalId})`,
        auteur: body.auteur || 'Système',
        visible_client: true,
      },
    });

    // Notification e-mail client (non bloquante)
    let notifyDocuments = false;
    try {
      const prefs: any[] = await prisma.$queryRawUnsafe(
        'SELECT "notification_documents" FROM "Reparation" WHERE "id" = ? LIMIT 1',
        params.id
      );
      notifyDocuments = Boolean(prefs?.[0]?.notification_documents);
    } catch (sqlError) {
      console.error('Erreur lecture préférence notification_documents:', sqlError);
    }

    if (notifyDocuments) {
      try {
        const client = await dolibarrAPI.getThirdParty(reparation.client_id);
        const clientEmail = (client as any)?.email as string | undefined;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
        const suiviUrl = appUrl ? `${appUrl}/suivi/${encodeURIComponent(reparation.ref)}` : '';

        if (clientEmail) {
          const subject = `[Atelier] Nouveau devis pour votre réparation ${reparation.ref}`;
          const text = [
            `Bonjour ${reparation.client_name},`,
            '',
            `Un devis vient d'être créé pour votre réparation ${reparation.ref}.`,
            `Référence devis Dolibarr: ${proposalId}`,
            `Montant estimé: ${(reparation.montant_estime || 0).toFixed(2)} EUR`,
            suiviUrl ? `Suivi en ligne: ${suiviUrl}` : '',
            '',
            'Cordialement,',
            "L'atelier",
          ]
            .filter(Boolean)
            .join('\n');

          await sendEmail({
            to: clientEmail,
            subject,
            text,
          });
        }
      } catch (notificationError) {
        console.error('Erreur notification e-mail devis:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      proposal_id: proposalId,
      message: 'Devis créé avec succès dans Dolibarr',
    });
  } catch (error: any) {
    console.error('Erreur lors de la création du devis:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la création du devis',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null,
      },
      { status: error.response?.status || 500 }
    );
  }
}

// GET /api/reparations/[id]/devis - Récupérer le devis lié à une réparation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reparation = await prisma.reparation.findUnique({
      where: { id: params.id },
      select: { devis_id: true },
    });

    if (!reparation || !reparation.devis_id) {
      return NextResponse.json(
        { error: 'Aucun devis lié à cette réparation' },
        { status: 404 }
      );
    }

    // Récupérer le devis depuis Dolibarr
    const proposal = await dolibarrAPI.getProposal(reparation.devis_id);

    return NextResponse.json(proposal);
  } catch (error) {
    console.error('Erreur lors de la récupération du devis:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du devis' },
      { status: 500 }
    );
  }
}
