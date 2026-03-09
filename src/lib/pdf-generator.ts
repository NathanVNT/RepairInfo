// Utilitaire pour générer un PDF d'accusé de réception avec QR code
// Nécessite: npm install jspdf qrcode

export async function generateRepairReceiptPDF(reparation: any) {
  // Import dynamique pour éviter les erreurs SSR
  const { jsPDF } = await import('jspdf');
  const qrcodeModule = await import('qrcode');

  // Gère les différents formats d'export du package qrcode selon le bundler.
  const qrCodeApi = (qrcodeModule as any).toDataURL
    ? (qrcodeModule as any)
    : (qrcodeModule as any).default;

  const doc = new jsPDF();

  const code39Patterns: Record<string, string> = {
    '0': 'nnnwwnwnn',
    '1': 'wnnwnnnnw',
    '2': 'nnwwnnnnw',
    '3': 'wnwwnnnnn',
    '4': 'nnnwwnnnw',
    '5': 'wnnwwnnnn',
    '6': 'nnwwwnnnn',
    '7': 'nnnwnnwnw',
    '8': 'wnnwnnwnn',
    '9': 'nnwwnnwnn',
    A: 'wnnnnwnnw',
    B: 'nnwnnwnnw',
    C: 'wnwnnwnnn',
    D: 'nnnnwwnnw',
    E: 'wnnnwwnnn',
    F: 'nnwnwwnnn',
    G: 'nnnnnwwnw',
    H: 'wnnnnwwnn',
    I: 'nnwnnwwnn',
    J: 'nnnnwwwnn',
    K: 'wnnnnnnww',
    L: 'nnwnnnnww',
    M: 'wnwnnnnwn',
    N: 'nnnnwnnww',
    O: 'wnnnwnnwn',
    P: 'nnwnwnnwn',
    Q: 'nnnnnnwww',
    R: 'wnnnnnwwn',
    S: 'nnwnnnwwn',
    T: 'nnnnwnwwn',
    U: 'wwnnnnnnw',
    V: 'nwwnnnnnw',
    W: 'wwwnnnnnn',
    X: 'nwnnwnnnw',
    Y: 'wwnnwnnnn',
    Z: 'nwwnwnnnn',
    '-': 'nwnnnnwnw',
    '.': 'wwnnnnwnn',
    ' ': 'nwwnnnwnn',
    '$': 'nwnwnwnnn',
    '/': 'nwnwnnnwn',
    '+': 'nwnnnwnwn',
    '%': 'nnnwnwnwn',
    '*': 'nwnnwnwnn',
  };

  const drawCode39 = (
    value: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    const sanitized = value.toUpperCase().replace(/[^0-9A-Z.\-\$\/\+% ]/g, '');
    const encoded = `*${sanitized}*`;
    const charCount = encoded.length;
    const totalUnits = charCount * 16 - 1;
    const unitWidth = width / totalUnits;
    let cursorX = x;

    doc.setFillColor(0, 0, 0);

    for (let charIndex = 0; charIndex < encoded.length; charIndex++) {
      const pattern = code39Patterns[encoded[charIndex]];
      if (!pattern) continue;

      for (let i = 0; i < pattern.length; i++) {
        const isBar = i % 2 === 0;
        const isWide = pattern[i] === 'w';
        const segmentWidth = unitWidth * (isWide ? 3 : 1);

        if (isBar) {
          doc.rect(cursorX, y, segmentWidth, height, 'F');
        }

        cursorX += segmentWidth;
      }

      if (charIndex < encoded.length - 1) {
        cursorX += unitWidth;
      }
    }
  };
  
  // Configuration
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = 20;

  // En-tête
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ACCUSÉ DE RÉCEPTION', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  doc.setFontSize(16);
  doc.text('DÉPÔT MATÉRIEL', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;

  // Informations réparation
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Référence: ${reparation.ref}`, margin, yPosition);
  
  yPosition += 8;
  doc.setFont('helvetica', 'normal');
  const baseDepotDate = new Date(reparation.date_depot);
  const createdAtDate = reparation.createdAt ? new Date(reparation.createdAt) : null;
  const isBaseDateValid = !Number.isNaN(baseDepotDate.getTime());

  let depotDate = isBaseDateValid ? baseDepotDate : new Date();

  // Si l'heure de dépôt est absente (souvent 00:00), réutiliser l'heure de création.
  if (createdAtDate && !Number.isNaN(createdAtDate.getTime())) {
    const noMeaningfulTime =
      depotDate.getHours() === 0 &&
      depotDate.getMinutes() === 0 &&
      depotDate.getSeconds() === 0;

    if (noMeaningfulTime) {
      depotDate = new Date(depotDate);
      depotDate.setHours(
        createdAtDate.getHours(),
        createdAtDate.getMinutes(),
        createdAtDate.getSeconds(),
        createdAtDate.getMilliseconds()
      );
    }
  }
  doc.text(
    `Date et heure de dépôt: ${depotDate.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    margin,
    yPosition
  );
  
  yPosition += 15;

  // Client
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT:', margin, yPosition);
  yPosition += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(reparation.client_name, margin, yPosition);
  
  yPosition += 15;

  // Appareil
  doc.setFont('helvetica', 'bold');
  doc.text('APPAREIL DÉPOSÉ:', margin, yPosition);
  yPosition += 7;
  doc.setFont('helvetica', 'normal');
 doc.text(`Type: ${reparation.appareil}`, margin, yPosition);
  yPosition += 6;
  if (reparation.marque) {
    doc.text(`Marque: ${reparation.marque}`, margin, yPosition);
    yPosition += 6;
  }
  if (reparation.modele) {
    doc.text(`Modèle: ${reparation.modele}`, margin, yPosition);
    yPosition += 6;
  }
  if (reparation.numero_serie) {
    doc.text(`N° de série: ${reparation.numero_serie}`, margin, yPosition);
    yPosition += 6;
  }
  
  yPosition += 10;

  // Description panne
  doc.setFont('helvetica', 'bold');
  doc.text('PANNE DÉCLARÉE:', margin, yPosition);
  yPosition += 7;
  doc.setFont('helvetica', 'normal');
  const panneLines = doc.splitTextToSize(reparation.description_panne, pageWidth - 2 * margin);
  doc.text(panneLines, margin, yPosition);
  yPosition += panneLines.length * 6 + 10;

  // Montant estimé
  if (reparation.montant_estime) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Montant estimé: ${reparation.montant_estime.toFixed(2)} €`, margin, yPosition);
    yPosition += 12;
  }

  // Clause de décharge
  yPosition += 10;
  const conditionsStartY = yPosition;
  
  const clauses = [
    '• Je déclare être le propriétaire légitime du matériel déposé.',
    '• Tout appareil non réclamé sous 3 mois fera l\'objet d\'une destruction.',
    '• Un devis sera établi avant toute intervention dépassant le montant estimé.',
    '• Les données personnelles peuvent être effacées lors de la réparation.',
    '• Il est conseillé de sauvegarder vos données avant le dépôt.',
  ];

  // Calcule la hauteur exacte avant de dessiner le fond jaune.
  const clausesHeight = clauses.reduce((total, clause) => {
    const lines = doc.splitTextToSize(clause, pageWidth - 2 * margin - 5);
    return total + lines.length * 5;
  }, 0);
  const conditionsHeaderHeight = 7;
  const conditionsPaddingTop = 5;
  const conditionsPaddingBottom = 4;
  const conditionsBoxHeight =
    conditionsPaddingTop + conditionsHeaderHeight + clausesHeight + conditionsPaddingBottom;

  doc.setFillColor(255, 243, 205);
  doc.rect(
    margin - 2,
    conditionsStartY - conditionsPaddingTop,
    pageWidth - 2 * margin + 4,
    conditionsBoxHeight,
    'F'
  );

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CONDITIONS ET DÉCHARGE DE RESPONSABILITÉ:', margin, yPosition);
  yPosition += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  clauses.forEach(clause => {
    const lines = doc.splitTextToSize(clause, pageWidth - 2 * margin - 5);
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * 5;
  });

  yPosition += 15;

  // QR Code
  const qrSize = 35;
  const qrX = pageWidth - qrSize - 6;
  const qrY = 6;

  try {
    const appBaseUrl =
      (typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      '';
    const trackingUrl = `${appBaseUrl}/suivi/${encodeURIComponent(reparation.ref)}`;

    const qrCodeDataUrl = await qrCodeApi.toDataURL(
      trackingUrl,
      {
        width: 150,
        margin: 1,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }
    );
    
    // Positionner le QR code en haut à droite
    doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    doc.setFontSize(8);
    doc.text('QR suivi web', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });
  } catch (error) {
    console.error('Erreur génération QR code:', error);
  }

  // Code-barres atelier (plus petit, sous le QR)
  const barcodeWidth = qrSize;
  const barcodeHeight = 11;
  const barcodeX = 6;
  const barcodeY = 8;
  drawCode39(reparation.ref, barcodeX, barcodeY, barcodeWidth, barcodeHeight);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`CB: ${reparation.ref}`, barcodeX + barcodeWidth / 2, barcodeY + barcodeHeight + 4, {
    align: 'center',
  });

  // Zone de signature
  yPosition = Math.max(yPosition, 230); // S'assurer qu'on est assez bas sur la page
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURE DU CLIENT:', margin, yPosition);
  doc.text('SIGNATURE DE L\'ATELIER:', pageWidth / 2 + 10, yPosition);
  
  yPosition += 5;
  
  // Cadres de signature
  doc.setLineWidth(0.5);
  doc.rect(margin, yPosition, (pageWidth - 2 * margin - 10) / 2, 30);
  doc.rect(pageWidth / 2 + 10, yPosition, (pageWidth - 2 * margin - 10) / 2, 30);
  
  yPosition += 35;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('(Précédée de "Lu et approuvé")', margin + 5, yPosition);
  doc.text('Date:', pageWidth / 2 + 15, yPosition);
  
  yPosition += 10;

  // Pied de page
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    'Ce document fait foi de dépôt du matériel et d\'acceptation des conditions.',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  // Générer et télécharger le PDF
  doc.save(`Accuse_Reception_${reparation.ref}.pdf`);
}
