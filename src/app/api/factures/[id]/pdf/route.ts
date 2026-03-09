import { NextResponse } from 'next/server';
import { dolibarrAPI } from '@/lib/dolibarr-api';

function looksLikePdf(bytes: Uint8Array): boolean {
  // Signature PDF: "%PDF-"
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

/**
 * GET /api/factures/[id]/pdf
 * Récupère le PDF de la facture via Dolibarr et le renvoie au navigateur.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    const invoice = await dolibarrAPI.getInvoice(invoiceId) as { ref?: string };

    const dolibarrBaseUrl = process.env.NEXT_PUBLIC_DOLIBARR_URL;
    const apiKey = process.env.NEXT_PUBLIC_DOLIBARR_API_KEY;
    if (!dolibarrBaseUrl) {
      return NextResponse.json(
        { error: 'Configuration Dolibarr manquante' },
        { status: 500 }
      );
    }
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clé API Dolibarr manquante' },
        { status: 500 }
      );
    }
    if (!invoice?.ref) {
      return NextResponse.json(
        { error: 'Référence de la facture introuvable' },
        { status: 404 }
      );
    }

    const normalizedBaseUrl = dolibarrBaseUrl.endsWith('/')
      ? dolibarrBaseUrl.slice(0, -1)
      : dolibarrBaseUrl;

    const normalizedRef = invoice.ref.replace(/[()]/g, '');
    const originalFileCandidates = [
      `${invoice.ref}/${invoice.ref}.pdf`,
      `${normalizedRef}/${normalizedRef}.pdf`,
      `${invoice.ref}.pdf`,
      `${normalizedRef}.pdf`,
    ];
    const templateCandidates = ['crabe', 'azur'];

    const errors: Array<{ attempt: string; status: number; details: string | null }> = [];

    for (const originalFile of originalFileCandidates) {
      for (const doctemplate of templateCandidates) {
        const builddocUrl = `${normalizedBaseUrl}/api/index.php/documents/builddoc`;
        const builddocBody = {
          modulepart: 'invoice',
          original_file: originalFile,
          doctemplate,
          langcode: 'fr_FR',
        };

        const builddocResponse = await fetch(builddocUrl, {
          method: 'PUT',
          headers: {
            DOLAPIKEY: apiKey,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(builddocBody),
          cache: 'no-store',
        });

        if (!builddocResponse.ok) {
          const text = await builddocResponse.text();
          errors.push({
            attempt: `documents/builddoc (${originalFile}, template=${doctemplate})`,
            status: builddocResponse.status,
            details: text ? text.slice(0, 500) : null,
          });
          continue;
        }

        const payload = await builddocResponse.json() as {
          content?: string;
          encoding?: string;
        };

        if (!payload?.content) {
          errors.push({
            attempt: `documents/builddoc (${originalFile}, template=${doctemplate})`,
            status: builddocResponse.status,
            details: 'Réponse builddoc sans contenu PDF',
          });
          continue;
        }

        const pdfBuffer = Buffer.from(payload.content, payload.encoding === 'base64' ? 'base64' : 'utf-8');
        if (!looksLikePdf(new Uint8Array(pdfBuffer))) {
          const preview = pdfBuffer.toString('utf-8', 0, 500);
          errors.push({
            attempt: `documents/builddoc (${originalFile}, template=${doctemplate})`,
            status: builddocResponse.status,
            details: preview || 'Contenu retourné non PDF',
          });
          continue;
        }

        return new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${invoice.ref}.pdf"`,
            'Cache-Control': 'no-store',
          },
        });
      }
    }

    return NextResponse.json(
      {
        error: 'Impossible de récupérer le PDF de la facture',
        status: errors[0]?.status || 500,
        details: errors,
      },
      { status: errors[0]?.status || 500 }
    );
  } catch (error: any) {
    console.error('Erreur lors du proxy du PDF de la facture:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'ouverture du PDF de la facture',
        message: error.message || 'Erreur inconnue',
        details: error.response?.data || null,
      },
      { status: error.response?.status || 500 }
    );
  }
}