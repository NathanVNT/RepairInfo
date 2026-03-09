'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Trash2,
  Plus,
  Scan,
  MessageSquare,
  Package,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  ExternalLink,
  Download
} from 'lucide-react';
import { Card, Badge, Button, Modal, Textarea, Input } from '@/components/ui';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { reparationService } from '@/lib/reparation-service';
import { DolibarrProduct, Reparation } from '@/types';
import { generateRepairReceiptPDF } from '@/lib/pdf-generator';

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const statutLabels: Record<Reparation['statut'], string> = {
  'en_attente': 'En attente',
  'diagnostic': 'Diagnostic',
  'en_reparation': 'En réparation',
  'en_attente_piece': 'En attente pièce',
  'terminee': 'Terminée',
  'livree': 'Livrée',
  'annulee': 'Annulée',
};

const statutColors: Record<Reparation['statut'], 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  'en_attente': 'default',
  'diagnostic': 'info',
  'en_reparation': 'warning',
  'en_attente_piece': 'warning',
  'terminee': 'success',
  'livree': 'success',
  'annulee': 'danger',
};

export default function ReparationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reparationId = params.id as string;

  const [reparation, setReparation] = useState<Reparation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistoriqueModal, setShowHistoriqueModal] = useState(false);
  const [showStatutModal, setShowStatutModal] = useState(false);
  const [showPieceModal, setShowPieceModal] = useState(false);
  const [showEditDevisModal, setShowEditDevisModal] = useState(false);
  const [newStatut, setNewStatut] = useState<Reparation['statut']>('en_attente');
  const [statutCommentaire, setStatutCommentaire] = useState('');
  const [historiqueAction, setHistoriqueAction] = useState('Mise à jour');
  const [historiqueDescription, setHistoriqueDescription] = useState('');
  const [historiqueVisibleClient, setHistoriqueVisibleClient] = useState(true);
  const [addingHistorique, setAddingHistorique] = useState(false);
  const [addingPiece, setAddingPiece] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pieceProductRef, setPieceProductRef] = useState('');
  const [pieceProductLabel, setPieceProductLabel] = useState('');
  const [pieceQuantite, setPieceQuantite] = useState('1');
  const [piecePrixUnitaire, setPiecePrixUnitaire] = useState('0');
  const [pieceProductId, setPieceProductId] = useState('');
  const [stockProducts, setStockProducts] = useState<DolibarrProduct[]>([]);
  const [loadingStockProducts, setLoadingStockProducts] = useState(false);
  const [stockProductsError, setStockProductsError] = useState<string | null>(null);
  const [stockSearch, setStockSearch] = useState('');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [usbScanInput, setUsbScanInput] = useState('');
  const usbScanInputRef = useRef<HTMLInputElement | null>(null);
  const [devisLines, setDevisLines] = useState<any[]>([]);
  const [devisInfo, setDevisInfo] = useState<any>(null);
  const [loadingDevis, setLoadingDevis] = useState(false);
  const [editingDevisLine, setEditingDevisLine] = useState<{ id: string; desc: string; qty: number; subprice: number } | null>(null);
  const [newDevisLineDesc, setNewDevisLineDesc] = useState('');
  const [newDevisLineQty, setNewDevisLineQty] = useState('1');
  const [newDevisLinePrice, setNewDevisLinePrice] = useState('0');

  useEffect(() => {
    loadReparation();
  }, [reparationId]);

  useEffect(() => {
    if (showPieceModal) {
      loadStockProducts();
      setTimeout(() => {
        usbScanInputRef.current?.focus();
      }, 50);
    }
  }, [showPieceModal]);

  const loadReparation = async () => {
    setLoading(true);
    try {
      const data = await reparationService.getReparation(reparationId);
      if (data) {
        setReparation(data);
        setNewStatut(data.statut);
      }
    } catch (error) {
      console.error('Erreur chargement réparation:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStockProducts = async () => {
    setLoadingStockProducts(true);
    setStockProductsError(null);
    try {
      const response = await fetch('/api/produits?limit=200&sortfield=ref&sortorder=ASC');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du chargement du stock');
      }
      const data = await response.json();
      setStockProducts(data);
    } catch (error: any) {
      console.error('Erreur chargement stock:', error);
      setStockProductsError(error.message || 'Impossible de charger le stock');
      setStockProducts([]);
    } finally {
      setLoadingStockProducts(false);
    }
  };

  const handleChangeStatut = async () => {
    if (!reparation) return;

    try {
      await reparationService.changeStatut(
        reparationId,
        newStatut,
        'Système',
        statutCommentaire
      );

      // Si le statut devient "livrée", marquer la facture comme payée
      if (newStatut === 'livree' && reparation.facture_id) {
        try {
          const response = await fetch(`/api/reparations/${reparationId}/facture/payer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              facture_id: reparation.facture_id,
              auteur: 'Système'
            })
          });
          if (!response.ok) {
            console.warn('Impossible de marquer la facture comme payée');
          } else {
            console.log('✅ Facture marquée comme payée');
          }
        } catch (error) {
          console.warn('Erreur lors du paiement de facture:', error);
        }
      }

      setShowStatutModal(false);
      setStatutCommentaire('');
      await loadReparation();
    } catch (error) {
      console.error('Erreur changement statut:', error);
      alert('Erreur lors du changement de statut');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réparation ?')) {
      return;
    }

    try {
      await reparationService.deleteReparation(reparationId);
      router.push('/reparations');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleCreateDevis = async () => {
    if (!reparation) return;

    router.push(`/devis/nouveau?reparationId=${encodeURIComponent(reparationId)}`);
  };

  const handleCreateFacture = async () => {
    if (!reparation) return;

    router.push(`/factures/nouveau?reparationId=${encodeURIComponent(reparationId)}`);
  };

  const handleDownloadPDF = async () => {
    if (!reparation) return;
    
    try {
      setGeneratingPDF(true);
      await generateRepairReceiptPDF(reparation);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const loadDevisLines = async () => {
    if (!reparation?.devis_id) return;

    setLoadingDevis(true);
    try {
      const response = await fetch(`/api/reparations/${reparationId}/devis/lignes?devisId=${reparation.devis_id}`);
      if (!response.ok) {
        throw new Error('Erreur chargement devis');
      }
      const data = await response.json();
      setDevisInfo(data);
      setDevisLines(data.lines || []);
    } catch (error) {
      console.error('Erreur chargement lignes devis:', error);
      alert('Erreur lors du chargement du devis');
    } finally {
      setLoadingDevis(false);
    }
  };

  const handleEditDevis = async () => {
    await loadDevisLines();
    setShowEditDevisModal(true);
    setNewDevisLineDesc('');
    setNewDevisLineQty('1');
    setNewDevisLinePrice('0');
  };

  const handleAddDevisLine = async () => {
    if (!reparation?.devis_id || !newDevisLineDesc.trim()) {
      alert('Merci de remplir tous les champs');
      return;
    }

    const qty = parseFloat(newDevisLineQty.replace(',', '.'));
    const price = parseFloat(newDevisLinePrice.replace(',', '.'));

    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price < 0) {
      alert('Quantité et prix doivent être des nombres valides');
      return;
    }

    try {
      const response = await fetch(`/api/reparations/${reparationId}/devis/lignes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          devisId: reparation.devis_id,
          line: {
            desc: newDevisLineDesc.trim(),
            qty: qty,
            subprice: price,
            tva_tx: 20
          }
        })
      });

      if (!response.ok) {
        throw new Error('Erreur ajout ligne');
      }

      setNewDevisLineDesc('');
      setNewDevisLineQty('1');
      setNewDevisLinePrice('0');
      await loadDevisLines();
    } catch (error) {
      console.error('Erreur ajout ligne devis:', error);
      alert('Erreur lors de l\'ajout de la ligne');
    }
  };

  const handleDeleteDevisLine = async (lineId: string) => {
    if (!reparation?.devis_id) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ligne ?')) return;

    try {
      const response = await fetch(`/api/reparations/${reparationId}/devis/lignes?devisId=${reparation.devis_id}&lineId=${lineId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erreur suppression ligne');
      }

      await loadDevisLines();
    } catch (error) {
      console.error('Erreur suppression ligne devis:', error);
      alert('Erreur lors de la suppression de la ligne');
    }
  };

  const handleUpdateFactureFromDevis = async () => {
    if (!reparation?.facture_id || !reparation?.devis_id) {
      alert('Une facture et un devis sont nécessaires');
      return;
    }

    if (!confirm('Cela va mettre à jour la facture pour qu\'elle suive le devis. Continuer ?')) {
      return;
    }

    try {
      setGeneratingPDF(true);
      const response = await fetch(`/api/reparations/${reparationId}/facture/sync-from-devis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facture_id: reparation.facture_id,
          devis_id: reparation.devis_id,
          auteur: 'Système'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur synchronisation');
      }

      alert('✅ Facture mise à jour avec succès');
      await loadReparation();
    } catch (error: any) {
      console.error('Erreur sync facture:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const resetPieceForm = () => {
    setPieceProductId('');
    setPieceProductRef('');
    setPieceProductLabel('');
    setPieceQuantite('1');
    setPiecePrixUnitaire('0');
    setStockSearch('');
    setUsbScanInput('');
  };

  const handleSelectStockProduct = (productId: string) => {
    setPieceProductId(productId);
    const selectedProduct = stockProducts.find((product) => String(product.id) === productId);
    if (!selectedProduct) {
      return;
    }

    setPieceProductRef(selectedProduct.ref || '');
    setPieceProductLabel(selectedProduct.label || '');
    setPiecePrixUnitaire(String(selectedProduct.price || 0));
    setPieceQuantite('1');
  };

  const handlePieceBarcodeScanned = (scannedValue: string) => {
    const normalized = scannedValue.trim().toLowerCase();
    if (!normalized) {
      return;
    }

    const exactMatch = stockProducts.find((product) => {
      const barcode = (product.barcode || '').trim().toLowerCase();
      const ref = (product.ref || '').trim().toLowerCase();
      return barcode === normalized || ref === normalized;
    });

    if (exactMatch) {
      setStockSearch(exactMatch.ref || scannedValue);
      handleSelectStockProduct(String(exactMatch.id));
      return;
    }

    const partialMatch = stockProducts.find((product) => {
      const barcode = (product.barcode || '').toLowerCase();
      const ref = (product.ref || '').toLowerCase();
      return barcode.includes(normalized) || ref.includes(normalized);
    });

    if (partialMatch) {
      setStockSearch(partialMatch.ref || scannedValue);
      handleSelectStockProduct(String(partialMatch.id));
      return;
    }

    setStockSearch(scannedValue);
    alert(`Aucun produit trouvé pour le code scanné: ${scannedValue}`);
  };

  const handleUsbScannerSubmit = () => {
    const code = usbScanInput.trim();
    if (!code) {
      return;
    }
    handlePieceBarcodeScanned(code);
    setUsbScanInput('');
    setTimeout(() => {
      usbScanInputRef.current?.focus();
    }, 50);
  };

  const handleAddPiece = async () => {
    if (!pieceProductLabel.trim()) {
      alert('Merci de renseigner le libellé de la pièce.');
      return;
    }

    const quantite = parseFloat(pieceQuantite.replace(',', '.'));
    const prixUnitaire = parseFloat(piecePrixUnitaire.replace(',', '.'));

    if (!Number.isFinite(quantite) || quantite <= 0) {
      alert('La quantité doit être un nombre positif.');
      return;
    }

    if (!Number.isFinite(prixUnitaire) || prixUnitaire < 0) {
      alert('Le prix unitaire doit être un nombre valide.');
      return;
    }

    const selectedProduct = stockProducts.find((product) => String(product.id) === pieceProductId);
    if (selectedProduct && selectedProduct.stock_reel !== undefined && quantite > selectedProduct.stock_reel) {
      alert(`Stock insuffisant: ${selectedProduct.stock_reel} en stock pour cette pièce.`);
      return;
    }

    try {
      setAddingPiece(true);
      const success = await reparationService.addPieceUtilisee(reparationId, {
        product_id: pieceProductId,
        product_ref: pieceProductRef.trim(),
        product_label: pieceProductLabel.trim(),
        quantite,
        prix_unitaire: prixUnitaire,
        total: quantite * prixUnitaire,
      });

      if (!success) {
        alert('Erreur lors de l\'ajout de la pièce');
        return;
      }

      setShowPieceModal(false);
      resetPieceForm();
      await loadReparation();
    } catch (error) {
      console.error('Erreur ajout pièce:', error);
      alert('Erreur lors de l\'ajout de la pièce');
    } finally {
      setAddingPiece(false);
    }
  };

  const handleAddHistorique = async () => {
    if (!historiqueAction.trim() || !historiqueDescription.trim()) {
      alert('Merci de renseigner l\'action et la description.');
      return;
    }

    try {
      setAddingHistorique(true);
      const success = await reparationService.addHistorique(
        reparationId,
        historiqueAction.trim(),
        historiqueDescription.trim(),
        'Système',
        historiqueVisibleClient
      );

      if (!success) {
        alert('Erreur lors de l\'ajout à l\'historique');
        return;
      }

      setShowHistoriqueModal(false);
      setHistoriqueAction('Mise à jour');
      setHistoriqueDescription('');
      setHistoriqueVisibleClient(true);
      await loadReparation();
    } catch (error) {
      console.error('Erreur ajout historique:', error);
      alert('Erreur lors de l\'ajout à l\'historique');
    } finally {
      setAddingHistorique(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!reparation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Réparation non trouvée</p>
          <Link href="/reparations">
            <Button>Retour à la liste</Button>
          </Link>
        </div>
      </div>
    );
  }

  const filteredStockProducts = stockProducts.filter((product) => {
    if (!stockSearch.trim()) return true;
    const term = stockSearch.toLowerCase();
    return (
      (product.ref || '').toLowerCase().includes(term) ||
      (product.label || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/reparations" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{reparation.ref}</h1>
                <p className="text-sm text-gray-600">{reparation.appareil}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="success" onClick={handleDownloadPDF} disabled={generatingPDF}>
                <Download className="h-5 w-5 mr-2" />
                {generatingPDF ? 'Génération...' : 'Accusé réception'}
              </Button>
              <Button variant="secondary" onClick={() => setShowStatutModal(true)}>
                <Clock className="h-5 w-5 mr-2" />
                Changer statut
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations générales */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Informations</h2>
                <Badge variant={statutColors[reparation.statut]}>
                  {statutLabels[reparation.statut]}
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Client</p>
                  <Link href={`/clients/${reparation.client_id}`} className="font-medium text-primary-600 hover:text-primary-700">
                    {reparation.client_name}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priorité</p>
                  <p className="font-medium capitalize">{reparation.priorite}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Appareil</p>
                  <p className="font-medium">{reparation.appareil}</p>
                </div>
                {reparation.marque && (
                  <div>
                    <p className="text-sm text-gray-600">Marque / Modèle</p>
                    <p className="font-medium">{reparation.marque} {reparation.modele}</p>
                  </div>
                )}
                {reparation.numero_serie && (
                  <div>
                    <p className="text-sm text-gray-600">Numéro de série</p>
                    <p className="font-medium font-mono text-sm">{reparation.numero_serie}</p>
                  </div>
                )}
                {reparation.technicien && (
                  <div>
                    <p className="text-sm text-gray-600">Technicien</p>
                    <p className="font-medium">{reparation.technicien}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Description de la panne</p>
                <p className="text-gray-900">{reparation.description_panne}</p>
              </div>

              {reparation.note_client && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">Note pour le client</p>
                  <p className="text-sm text-blue-800">{reparation.note_client}</p>
                </div>
              )}

              {reparation.note_interne && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-1">Note interne</p>
                  <p className="text-sm text-gray-700">{reparation.note_interne}</p>
                </div>
              )}
            </Card>

            {/* Pièces utilisées */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Pièces utilisées
                </h2>
                <Button size="sm" variant="secondary" onClick={() => setShowPieceModal(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              {reparation.pieces_utilisees && reparation.pieces_utilisees.length > 0 ? (
                <div className="space-y-2">
                  {reparation.pieces_utilisees.map(piece => (
                    <div key={piece.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{piece.product_label}</p>
                        <p className="text-sm text-gray-600">{piece.product_ref}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">x{piece.quantite}</p>
                        <p className="font-medium text-gray-900">{toNumber(piece.total).toFixed(2)}€</p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <p className="font-semibold text-gray-900">Total pièces</p>
                      <p className="font-semibold text-gray-900">
                        {toNumber(reparation.pieces_utilisees.reduce((sum, p) => sum + toNumber(p.total), 0)).toFixed(2)}€
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Aucune pièce ajoutée</p>
              )}
            </Card>

            {/* Historique */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Historique
                </h2>
                <Button size="sm" variant="secondary" onClick={() => setShowHistoriqueModal(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              <div className="space-y-4">
                {reparation.historique.map((entry, index) => (
                  <div key={entry.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${entry.visible_client ? 'bg-primary-600' : 'bg-gray-400'}`} />
                      {index < reparation.historique.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-medium text-gray-900">{entry.action}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(entry.date).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">{entry.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        par {entry.auteur}
                        {entry.visible_client && (
                          <span className="ml-2 text-primary-600">• Visible client</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Colonne secondaire */}
          <div className="space-y-6">
            {/* Dates */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Dates
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Dépôt</p>
                  <p className="font-medium">{new Date(reparation.date_depot).toLocaleDateString('fr-FR')}</p>
                </div>
                {reparation.date_prevue && (
                  <div>
                    <p className="text-sm text-gray-600">Prévue</p>
                    <p className="font-medium">{new Date(reparation.date_prevue).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
                {reparation.date_fin && (
                  <div>
                    <p className="text-sm text-gray-600">Terminée</p>
                    <p className="font-medium">{new Date(reparation.date_fin).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Devis & Factures */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Devis & Factures
              </h2>
              <div className="space-y-2">
                {reparation.devis_id ? (
                  <div className="space-y-2">
                    <a 
                      href={`/api/devis/${reparation.devis_id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="secondary" className="w-full">
                        <FileText className="h-5 w-5 mr-2" />
                        Voir le devis (PDF)
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </a>
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={handleEditDevis}
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      Modifier le devis
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={handleCreateDevis}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Créer un devis
                  </Button>
                )}

                {reparation.facture_id ? (
                  <div className="space-y-2">
                    <a 
                      href={`/api/factures/${reparation.facture_id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="secondary" className="w-full">
                        <FileText className="h-5 w-5 mr-2" />
                        Voir la facture (PDF)
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </a>
                    {reparation.devis_id && (
                      <Button 
                        variant="secondary" 
                        className="w-full"
                        onClick={handleUpdateFactureFromDevis}
                        disabled={generatingPDF}
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Mettre à jour depuis le devis
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={handleCreateFacture}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Créer une facture
                  </Button>
                )}
                
              </div>
            </Card>

          </div>
        </div>
      </main>

      {/* Modal changement de statut */}
      <Modal
        isOpen={showPieceModal}
        onClose={() => {
          if (!addingPiece) {
            setShowPieceModal(false);
            resetPieceForm();
          }
        }}
        title="Ajouter une pièce"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowPieceModal(false);
                resetPieceForm();
              }}
              disabled={addingPiece}
            >
              Annuler
            </Button>
            <Button onClick={handleAddPiece} disabled={addingPiece}>
              {addingPiece ? 'Ajout...' : 'Ajouter'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="border rounded-md p-3 bg-gray-50">
            <p className="text-sm font-medium text-gray-900 mb-2">Choisir dans le stock</p>
            <div className="border border-dashed border-gray-300 rounded-md p-3 mb-3 bg-white">
              <p className="text-sm font-medium text-gray-900 mb-2">Scan douchette USB</p>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code-barres
                  </label>
                  <input
                    ref={usbScanInputRef}
                    type="text"
                    value={usbScanInput}
                    onChange={(e) => setUsbScanInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleUsbScannerSubmit();
                      }
                    }}
                    placeholder="Scanne ici avec la douchette puis Entrée"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <Button type="button" variant="secondary" onClick={handleUsbScannerSubmit}>
                  Valider
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => usbScanInputRef.current?.focus()}
                >
                  Focus scan
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Astuce: la plupart des douchettes envoient automatiquement Entrée après le code.
              </p>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label="Recherche"
                  placeholder="Référence ou libellé"
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowBarcodeScanner(true)}
                className="mb-4"
              >
                <Scan className="h-4 w-4 mr-2" />
                Scanner
              </Button>
            </div>
            {loadingStockProducts ? (
              <p className="text-sm text-gray-600">Chargement du stock...</p>
            ) : stockProductsError ? (
              <div className="space-y-2">
                <p className="text-sm text-red-600">{stockProductsError}</p>
                <Button size="sm" variant="secondary" onClick={loadStockProducts}>
                  Réessayer
                </Button>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produit en stock
                </label>
                <select
                  value={pieceProductId}
                  onChange={(e) => handleSelectStockProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Sélectionner une pièce</option>
                  {filteredStockProducts.map((product) => (
                    <option key={product.id} value={String(product.id)}>
                      {product.ref} - {product.label} (stock: {product.stock_reel ?? 0})
                    </option>
                  ))}
                </select>
                {pieceProductId && (
                  <p className="text-xs text-gray-500 mt-2">
                    Produit sélectionné depuis le stock.
                  </p>
                )}
              </div>
            )}
          </div>

          <Input
            label="Référence pièce"
            placeholder="Ex: SSD-1TB"
            value={pieceProductRef}
            onChange={(e) => setPieceProductRef(e.target.value)}
          />
          <Input
            label="Libellé"
            placeholder="Ex: SSD NVMe 1 To"
            value={pieceProductLabel}
            onChange={(e) => setPieceProductLabel(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantité"
              type="number"
              min="0.01"
              step="0.01"
              value={pieceQuantite}
              onChange={(e) => setPieceQuantite(e.target.value)}
              required
            />
            <Input
              label="Prix unitaire (EUR)"
              type="number"
              min="0"
              step="0.01"
              value={piecePrixUnitaire}
              onChange={(e) => setPiecePrixUnitaire(e.target.value)}
              required
            />
          </div>
        </div>
      </Modal>

      {showBarcodeScanner && (
        <BarcodeScanner
          title="Scanner une pièce du stock"
          onScan={handlePieceBarcodeScanned}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

      {/* Modal ajout de suivi */}
      <Modal
        isOpen={showHistoriqueModal}
        onClose={() => {
          if (!addingHistorique) setShowHistoriqueModal(false);
        }}
        title="Ajouter un suivi"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowHistoriqueModal(false)}
              disabled={addingHistorique}
            >
              Annuler
            </Button>
            <Button onClick={handleAddHistorique} disabled={addingHistorique}>
              {addingHistorique ? 'Ajout...' : 'Ajouter'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <input
              type="text"
              value={historiqueAction}
              onChange={(e) => setHistoriqueAction(e.target.value)}
              placeholder="Ex: Diagnostic effectué"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Détaillez le suivi ajouté..."
            value={historiqueDescription}
            onChange={(e) => setHistoriqueDescription(e.target.value)}
            rows={4}
          />

          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={historiqueVisibleClient}
              onChange={(e) => setHistoriqueVisibleClient(e.target.checked)}
              className="h-4 w-4"
            />
            Visible pour le client
          </label>
        </div>
      </Modal>

      {/* Modal changement de statut */}
      <Modal
        isOpen={showStatutModal}
        onClose={() => setShowStatutModal(false)}
        title="Changer le statut"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowStatutModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleChangeStatut}>
              Confirmer
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau statut
            </label>
            <select
              value={newStatut}
              onChange={(e) => setNewStatut(e.target.value as Reparation['statut'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {Object.entries(statutLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <Textarea
            label="Commentaire (optionnel)"
            placeholder="Ajoutez un commentaire..."
            value={statutCommentaire}
            onChange={(e) => setStatutCommentaire(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>

      {/* Modal édition devis */}
      <Modal
        isOpen={showEditDevisModal}
        onClose={() => {
          if (!loadingDevis) setShowEditDevisModal(false);
        }}
        title={`Modifier le devis ${devisInfo?.ref || ''}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowEditDevisModal(false)}
              disabled={loadingDevis}
            >
              Fermer
            </Button>
          </>
        }
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {loadingDevis ? (
            <p className="text-center text-gray-600">Chargement...</p>
          ) : (
            <>
              {/* Lignes existantes */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Lignes actuelles</h3>
                {devisLines.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune ligne</p>
                ) : (
                  <div className="space-y-2">
                    {devisLines.map((line: any, idx: number) => (
                      <div key={line.id || idx} className="flex items-start justify-between p-2 border border-gray-300 rounded-md bg-gray-50">
                        <div className="flex-1 text-sm">
                          <p className="font-medium text-gray-900">{line.description || line.desc}</p>
                          <p className="text-gray-600">
                            {toNumber(line.qty)}x à {toNumber(line.subprice || line.pu).toFixed(2)}€ = {toNumber(line.total || (toNumber(line.qty) * toNumber(line.subprice || line.pu))).toFixed(2)}€
                          </p>
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteDevisLine(line.id)}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ajouter une ligne */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Ajouter une ligne</h3>
                <div className="space-y-2">
                  <Input
                    label="Description"
                    placeholder="Ex: Main d'œuvre supplémentaire"
                    value={newDevisLineDesc}
                    onChange={(e) => setNewDevisLineDesc(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Quantité"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={newDevisLineQty}
                      onChange={(e) => setNewDevisLineQty(e.target.value)}
                    />
                    <Input
                      label="Prix unitaire (EUR)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newDevisLinePrice}
                      onChange={(e) => setNewDevisLinePrice(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddDevisLine} className="w-full">
                    <Plus className="h-5 w-5 mr-2" />
                    Ajouter la ligne
                  </Button>
                </div>
              </div>

              {/* Résumé */}
              {devisInfo && (
                <div className="border-t pt-4 text-sm">
                  <p className="flex justify-between">
                    <span>Total HT:</span>
                    <span className="font-medium">{toNumber(devisInfo.total_ht || 0).toFixed(2)}€</span>
                  </p>
                  <p className="flex justify-between">
                    <span>TVA (20%):</span>
                    <span className="font-medium">{toNumber(devisInfo.total_tva || 0).toFixed(2)}€</span>
                  </p>
                  <p className="flex justify-between font-semibold text-lg mt-2">
                    <span>Total TTC:</span>
                    <span>{toNumber(devisInfo.total_ttc || 0).toFixed(2)}€</span>
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
