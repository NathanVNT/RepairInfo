import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dolibarrAPI } from '@/lib/dolibarr-api';
import { sendEmail } from '@/lib/email-service';

// POST /api/reparations/[id]/facture - Créer une facture Dolibarr depuis une réparation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { type = 0 } = body; // 0 = facture standard, 2 = avoir (credit note)

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

    // Créer la facture dans Dolibarr
    const invoiceData = {
      socid: reparation.client_id,
      type: type,
      date: Math.floor(Date.now() / 1000),
      note_public: `Réparation ${reparation.ref}\n${reparation.appareil} - ${reparation.marque || ''} ${reparation.modele || ''}`,
      note_private: reparation.note_interne || '',
    };

    const invoice = await dolibarrAPI.createInvoice(invoiceData);
    const invoiceIdRaw = (invoice as any)?.id ?? invoice;
    const invoiceId = String(invoiceIdRaw);

    if (!invoiceId || invoiceId === 'undefined' || invoiceId === 'null') {
      throw new Error('ID facture Dolibarr invalide après création');
    }

    // Ajouter les lignes de facture
    // Ligne principale : Réparation
    await dolibarrAPI.addInvoiceLine(invoiceId, {
      desc: `Réparation ${reparation.appareil}\n${reparation.description_panne}`,
      subprice: reparation.montant_final || reparation.montant_estime || 0,
      qty: 1,
      tva_tx: 20, // 20% TVA par défaut
    });

    // Ajouter les pièces utilisées comme lignes
    if (reparation.pieces_utilisees && reparation.pieces_utilisees.length > 0) {
      for (const piece of reparation.pieces_utilisees) {
        await dolibarrAPI.addInvoiceLine(invoiceId, {
          fk_product: piece.product_id,
          desc: piece.product_label,
          subprice: piece.prix_unitaire,
          qty: piece.quantite,
          tva_tx: 20,
        });
      }
    }

    // Mettre à jour la réparation avec l'ID de la facture
    await prisma.reparation.update({
      where: { id: params.id },
      data: { facture_id: invoiceId },
    });

    // Ajouter à l'historique
    await prisma.reparationHistorique.create({
      data: {
        reparation_id: params.id,
        action: 'Facture créée',
        description: `Facture Dolibarr créée (ID: ${invoiceId})`,
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
          const montant = reparation.montant_final || reparation.montant_estime || 0;
          const subject = `[Atelier] Nouvelle facture pour votre réparation ${reparation.ref}`;
          const text = [
            `Bonjour ${reparation.client_name},`,
            '',
            `Une facture vient d'être créée pour votre réparation ${reparation.ref}.`,
            `Référence facture Dolibarr: ${invoiceId}`,
            `Montant: ${montant.toFixed(2)} EUR`,
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
        console.error('Erreur notification e-mail facture:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      invoice_id: invoiceId,
      message: 'Facture créée avec succès dans Dolibarr',
    });
  } catch (error: any) {
    console.error('Erreur lors de la création de la facture:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la création de la facture',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null,
      },
      { status: error.response?.status || 500 }
    );
  }
}

// GET /api/reparations/[id]/facture - Récupérer la facture liée à une réparation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reparation = await prisma.reparation.findUnique({
      where: { id: params.id },
      select: { facture_id: true },
    });

    if (!reparation || !reparation.facture_id) {
      return NextResponse.json(
        { error: 'Aucune facture liée à cette réparation' },
        { status: 404 }
      );
    }

    // Récupérer la facture depuis Dolibarr
    const invoice = await dolibarrAPI.getInvoice(reparation.facture_id);

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Erreur lors de la récupération de la facture:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la facture' },
      { status: 500 }
    );
  }
}
