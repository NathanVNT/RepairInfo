import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dolibarrAPI } from '@/lib/dolibarr-api';

// POST /api/reparations/[id]/pieces - Ajouter une pièce utilisée
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const piece = await prisma.pieceUtilisee.create({
      data: {
        reparation_id: params.id,
        product_id: body.product_id,
        product_ref: body.product_ref,
        product_label: body.product_label,
        quantite: body.quantite,
        prix_unitaire: body.prix_unitaire,
        total: body.prix_unitaire * body.quantite,
      },
    });

    // Enlever du stock: mouvement de type 0 (sortie)
    try {
      await dolibarrAPI.updateStock(body.product_id, '1', body.quantite, 0);
      console.log(`✅ Stock réduit pour produit ${body.product_ref} (-${body.quantite})`);
    } catch (stockError: any) {
      console.warn(`⚠️ Impossible d'enlever du stock pour ${body.product_ref}:`, stockError.message);
      // On continue même si le mouvement échoue, car la pièce doit être enregistrée
    }

    // Mettre à jour le montant final de la réparation
    const pieces = await prisma.pieceUtilisee.findMany({
      where: { reparation_id: params.id },
    });

    const total = pieces.reduce((sum: number, p: any) => sum + p.total, 0);

    await prisma.reparation.update({
      where: { id: params.id },
      data: { montant_final: total },
    });

    // Ajouter une entrée à l'historique
    await prisma.reparationHistorique.create({
      data: {
        reparation_id: params.id,
        action: 'Ajout de pièce',
        description: `Pièce ajoutée: ${body.product_label} (x${body.quantite})`,
        auteur: body.auteur || 'Système',
        visible_client: false,
      },
    });

    return NextResponse.json(piece, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la pièce:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout de la pièce" },
      { status: 500 }
    );
  }
}

// DELETE /api/reparations/[id]/pieces/[pieceId] - Supprimer une pièce
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const pieceId = searchParams.get('pieceId');

    if (!pieceId) {
      return NextResponse.json(
        { error: 'ID de pièce manquant' },
        { status: 400 }
      );
    }

    // Récupérer les infos de la pièce avant suppression (pour le mouvement de stock inverse)
    const piece = await prisma.pieceUtilisee.findUnique({
      where: { id: pieceId },
    });

    if (!piece) {
      return NextResponse.json(
        { error: 'Pièce non trouvée' },
        { status: 404 }
      );
    }

    // Supprimer la pièce
    await prisma.pieceUtilisee.delete({
      where: { id: pieceId },
    });

    // Remettre en stock: mouvement de type 1 (entrée)
    try {
      await dolibarrAPI.updateStock(piece.product_id, '1', piece.quantite, 1);
      console.log(`✅ Stock restauré pour produit ${piece.product_ref} (+${piece.quantite})`);
    } catch (stockError: any) {
      console.warn(`⚠️ Impossible de remettre en stock ${piece.product_ref}:`, stockError.message);
      // On continue même si l'opération échoue
    }

    // Mettre à jour le montant final de la réparation
    const pieces = await prisma.pieceUtilisee.findMany({
      where: { reparation_id: params.id },
    });

    const total = pieces.reduce((sum: number, p: any) => sum + p.total, 0);

    await prisma.reparation.update({
      where: { id: params.id },
      data: { montant_final: total },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de la pièce:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la pièce' },
      { status: 500 }
    );
  }
}
