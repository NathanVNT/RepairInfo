'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  FileText,
  CheckCircle,
  Calendar,
  User,
  Euro,
  Download,
  Eye,
  CreditCard,
  Trash2,
  Pencil
} from 'lucide-react';
import { Button, Card, Badge, Modal, Input, Textarea } from '@/components/ui';
import { DolibarrInvoice } from '@/types';

function normalizeDisplayNote(value: unknown): string {
  return String(value ?? '').replace(/<br\s*\/?>/gi, '\n');
}

const statutLabels: Record<string, string> = {
  '0': 'Brouillon',
  '1': 'Validée',
  '2': 'Payée',
  '3': 'Abandonnée',
};

const statutColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  '0': 'default',
  '1': 'info',
  '2': 'success',
  '3': 'danger',
};

export default function FactureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const factureId = params.id as string;

  const [facture, setFacture] = useState<DolibarrInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState({
    datepaye: new Date().toISOString().split('T')[0],
    paiementid: '4', // 4 = Virement
    closepaidinvoices: 'yes',
    accountid: '1', // ID du compte bancaire
    num_payment: '',
    comment: '',
    chqemetteur: '',
    chqbank: '',
  });
  const [paying, setPaying] = useState(false);
  const [validating, setValidating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editPublicNote, setEditPublicNote] = useState('');
  const [editPrivateNote, setEditPrivateNote] = useState('');
  const [showEditLineModal, setShowEditLineModal] = useState(false);
  const [editingLineId, setEditingLineId] = useState('');
  const [editingLineDescription, setEditingLineDescription] = useState('');
  const [editingLineQty, setEditingLineQty] = useState('1');
  const [editingLinePrice, setEditingLinePrice] = useState('0');
  const [editingLineVat, setEditingLineVat] = useState('20');
  const [savingLine, setSavingLine] = useState(false);
  const [deletingLineId, setDeletingLineId] = useState<string | null>(null);

  useEffect(() => {
    loadFacture();
    loadBankAccounts();
  }, [factureId]);

  const loadFacture = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/factures/${factureId}`);
      if (response.ok) {
        const data = await response.json();
        setFacture(data);
      }
    } catch (error) {
      console.error('Erreur chargement facture:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const response = await fetch('/api/bankaccounts');
      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data);
      }
    } catch (error) {
      console.error('Erreur chargement comptes bancaires:', error);
    }
  };

  const handleValidate = async () => {
    if (!confirm('Voulez-vous valider cette facture ? Elle ne pourra plus être modifiée.')) {
      return;
    }

    setValidating(true);
    try {
      const response = await fetch(`/api/factures/${factureId}/validate`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Facture validée avec succès !');
        await loadFacture();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.message || 'Impossible de valider la facture'}`);
      }
    } catch (error) {
      console.error('Erreur validation facture:', error);
      alert('Erreur lors de la validation de la facture');
    } finally {
      setValidating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Voulez-vous vraiment supprimer cette facture provisoire ?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/factures/${factureId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Facture supprimée avec succès !');
        router.push('/factures');
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.message || 'Impossible de supprimer la facture'}`);
      }
    } catch (error) {
      console.error('Erreur suppression facture:', error);
      alert('Erreur lors de la suppression de la facture');
    } finally {
      setDeleting(false);
    }
  };

  const handlePayment = async () => {
    setPaying(true);
    try {
      // Construction du payload en omettant les undefined
      const paymentPayload: any = {
        datepaye: Math.floor(new Date(paymentData.datepaye).getTime() / 1000),
        paymentid: parseInt(paymentData.paiementid),  // Note: paymentid, pas paiementid
        closepaidinvoices: 'yes',
        accountid: parseInt(paymentData.accountid),  // ID du compte bancaire
        amount: parseFloat(facture?.total_ttc as any),
      };
      
      // Ajout conditionnel des champs optionnels
      if (paymentData.num_payment) {
        paymentPayload.num_payment = paymentData.num_payment;
      }
      if (paymentData.comment) {
        paymentPayload.comment = paymentData.comment;
      }
      if (paymentData.paiementid === '3') {
        if (paymentData.chqemetteur) paymentPayload.chqemetteur = paymentData.chqemetteur;
        if (paymentData.chqbank) paymentPayload.chqbank = paymentData.chqbank;
      }
      
      console.log('Envoi paiement:', paymentPayload);
      console.log('Vers facture ID:', factureId);
      
      const response = await fetch(`/api/factures/${factureId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentPayload),
      });

      if (response.ok) {
        alert('Paiement enregistré avec succès !');
        setShowPaymentModal(false);
        await loadFacture();
      } else {
        const error = await response.json();
        console.error('Erreur paiement:', error);
        alert(`Erreur: ${error?.details?.error?.message || error.message || 'Impossible d\'enregistrer le paiement'}`);
      }
    } catch (error) {
      console.error('Erreur enregistrement paiement:', error);
      alert('Erreur lors de l\'enregistrement du paiement');
    } finally {
      setPaying(false);
    }
  };

  const openInDolibarr = () => {
    const dolibarrUrl = process.env.NEXT_PUBLIC_DOLIBARR_URL;
    window.open(`${dolibarrUrl}/compta/facture/card.php?id=${factureId}`, '_blank');
  };

  const openEditModal = () => {
    setEditPublicNote(normalizeDisplayNote(facture?.note_public || ''));
    setEditPrivateNote(normalizeDisplayNote(facture?.note_private || ''));
    setShowEditModal(true);
  };

  const handleSaveDraftEdits = async () => {
    setSavingEdit(true);
    try {
      const response = await fetch(`/api/factures/${factureId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note_public: editPublicNote,
          note_private: editPrivateNote,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(`Erreur: ${error?.message || error?.error || 'Mise a jour impossible'}`);
        return;
      }

      setShowEditModal(false);
      await loadFacture();
      alert('Facture provisoire mise a jour.');
    } catch (error) {
      console.error('Erreur mise a jour facture:', error);
      alert('Erreur lors de la mise a jour de la facture');
    } finally {
      setSavingEdit(false);
    }
  };

  const openEditLineModal = (line: any) => {
    if (!line?.id) return;
    setEditingLineId(String(line.id));
    setEditingLineDescription(String(line.description || line.product_label || ''));
    setEditingLineQty(String(line.qty ?? 1));
    setEditingLinePrice(String(line.subprice ?? 0));
    setEditingLineVat(String(line.tva_tx ?? 20));
    setShowEditLineModal(true);
  };

  const handleSaveLine = async () => {
    if (!editingLineId) return;
    setSavingLine(true);
    try {
      const payload = {
        desc: editingLineDescription,
        qty: Number(editingLineQty || '0'),
        subprice: Number(editingLinePrice || '0'),
        tva_tx: Number(editingLineVat || '0'),
      };

      const response = await fetch(`/api/factures/${factureId}/lines/${editingLineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(`Erreur: ${error?.message || error?.error || 'Modification impossible'}`);
        return;
      }

      setShowEditLineModal(false);
      await loadFacture();
    } catch (error) {
      console.error('Erreur modification ligne facture:', error);
      alert('Erreur lors de la modification de la ligne');
    } finally {
      setSavingLine(false);
    }
  };

  const handleDeleteLine = async (lineId: string) => {
    if (!confirm('Supprimer cette ligne de la facture ?')) return;
    setDeletingLineId(lineId);
    try {
      const response = await fetch(`/api/factures/${factureId}/lines/${lineId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(`Erreur: ${error?.message || error?.error || 'Suppression impossible'}`);
        return;
      }

      await loadFacture();
    } catch (error) {
      console.error('Erreur suppression ligne facture:', error);
      alert('Erreur lors de la suppression de la ligne');
    } finally {
      setDeletingLineId(null);
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

  if (!facture) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Facture non trouvée</p>
          <Link href="/factures">
            <Button>Retour à la liste</Button>
          </Link>
        </div>
      </div>
    );
  }

  const dateFacture = new Date((facture.date || 0) * 1000);
  const dateCreation = new Date((facture.date_creation || 0) * 1000);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/factures" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{facture.ref}</h1>
                <p className="text-sm text-gray-600">Facture</p>
              </div>
            </div>
            <div className="flex gap-2">
              {facture.statut === '0' && (
                <>
                  <Button variant="secondary" onClick={openEditModal}>
                    <FileText className="h-5 w-5 mr-2" />
                    Modifier
                  </Button>
                  <Button 
                    variant="success" 
                    onClick={handleValidate}
                    disabled={validating}
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {validating ? 'Validation...' : 'Valider la facture'}
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    <Trash2 className="h-5 w-5 mr-2" />
                    {deleting ? 'Suppression...' : 'Supprimer'}
                  </Button>
                </>
              )}
              {facture.statut === '1' && facture.paye !== '1' && (
                <Button 
                  variant="success" 
                  onClick={() => setShowPaymentModal(true)}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Marquer comme payée
                </Button>
              )}
              <Button variant="secondary" onClick={openInDolibarr}>
                <Eye className="h-5 w-5 mr-2" />
                Voir dans Dolibarr
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
                <Badge variant={statutColors[facture.statut]}>
                  {statutLabels[facture.statut]}
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date de facture</p>
                  <div className="flex items-center text-gray-900 font-medium">
                    <Calendar className="h-4 w-4 mr-2" />
                    {dateFacture.toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date de création</p>
                  <p className="font-medium">{dateCreation.toLocaleDateString('fr-FR')}</p>
                </div>
                {facture.date_validation && (
                  <div>
                    <p className="text-sm text-gray-600">Date de validation</p>
                    <p className="font-medium">
                      {new Date(facture.date_validation * 1000).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>

              {facture.note_public && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Note publique</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{normalizeDisplayNote(facture.note_public)}</p>
                </div>
              )}

              {facture.note_private && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Note privée</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{normalizeDisplayNote(facture.note_private)}</p>
                </div>
              )}
            </Card>

            {/* Lignes de facture */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lignes de facture</h2>
              
              {facture.lines && facture.lines.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Description
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Qté
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Prix HT
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          TVA
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Total HT
                        </th>
                        {facture.statut === '0' && (
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {facture.lines.map((line, index) => (
                        <tr key={line.id || index}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {line.description || line.product_label}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {line.qty}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {(parseFloat(line.subprice as any) || 0).toFixed(2)} €
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {line.tva_tx}%
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            {(parseFloat(line.total_ht as any) || 0).toFixed(2)} €
                          </td>
                          {facture.statut === '0' && (
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditLineModal(line)}
                                  className="inline-flex items-center rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLine(String(line.id || ''))}
                                  disabled={!line.id || deletingLineId === String(line.id)}
                                  className="inline-flex items-center rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">Aucune ligne</p>
              )}
            </Card>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Totaux */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Montants</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total HT</span>
                  <span className="font-medium">{(parseFloat(facture.total_ht as any) || 0).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total TVA</span>
                  <span className="font-medium">{(parseFloat(facture.total_tva as any) || 0).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between pt-3 border-t text-lg font-bold">
                  <span>Total TTC</span>
                  <span className="text-primary-600">{(parseFloat(facture.total_ttc as any) || 0).toFixed(2)} €</span>
                </div>
                {facture.statut === '2' && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span className="font-medium">Facture payée</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Modal
        isOpen={showEditModal}
        onClose={() => !savingEdit && setShowEditModal(false)}
        title="Modifier la facture provisoire"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowEditModal(false)}
              disabled={savingEdit}
            >
              Annuler
            </Button>
            <Button onClick={handleSaveDraftEdits} disabled={savingEdit}>
              {savingEdit ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Note publique"
            value={editPublicNote}
            onChange={(e) => setEditPublicNote(e.target.value)}
            rows={5}
            placeholder="Visible sur la facture"
          />
          <Textarea
            label="Note privee"
            value={editPrivateNote}
            onChange={(e) => setEditPrivateNote(e.target.value)}
            rows={5}
            placeholder="Note interne"
          />
        </div>
      </Modal>

      <Modal
        isOpen={showEditLineModal}
        onClose={() => !savingLine && setShowEditLineModal(false)}
        title="Modifier la ligne de facture"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditLineModal(false)} disabled={savingLine}>
              Annuler
            </Button>
            <Button onClick={handleSaveLine} disabled={savingLine}>
              {savingLine ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Textarea
            label="Description"
            rows={4}
            value={editingLineDescription}
            onChange={(e) => setEditingLineDescription(e.target.value)}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Qte"
              type="number"
              min="0.01"
              step="0.01"
              value={editingLineQty}
              onChange={(e) => setEditingLineQty(e.target.value)}
            />
            <Input
              label="Prix HT"
              type="number"
              min="0"
              step="0.01"
              value={editingLinePrice}
              onChange={(e) => setEditingLinePrice(e.target.value)}
            />
            <Input
              label="TVA %"
              type="number"
              min="0"
              step="0.01"
              value={editingLineVat}
              onChange={(e) => setEditingLineVat(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Modal paiement */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Enregistrer un paiement"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
              Annuler
            </Button>
            <Button onClick={handlePayment} disabled={paying}>
              <CreditCard className="h-5 w-5 mr-2" />
              {paying ? 'Enregistrement...' : 'Enregistrer le paiement'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de paiement *
            </label>
            <input
              type="date"
              value={paymentData.datepaye}
              onChange={(e) => setPaymentData({ ...paymentData, datepaye: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mode de règlement *
            </label>
            <select
              value={paymentData.paiementid}
              onChange={(e) => setPaymentData({ ...paymentData, paiementid: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="4">Virement</option>
              <option value="6">Carte bancaire</option>
              <option value="3">Chèque</option>
              <option value="2">Prélèvement</option>
              <option value="1">Espèces</option>
              <option value="7">PayPal</option>
              <option value="0">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compte bancaire *
            </label>
            <select
              value={paymentData.accountid}
              onChange={(e) => setPaymentData({ ...paymentData, accountid: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {bankAccounts.length === 0 && (
                <option value="1">Compte par défaut</option>
              )}
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.label || account.ref} {account.number ? `(${account.number})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant
            </label>
            <input
              type="text"
              value={`${(parseFloat(facture?.total_ttc as any) || 0).toFixed(2)} €`}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numéro de paiement
            </label>
            <input
              type="text"
              value={paymentData.num_payment}
              onChange={(e) => setPaymentData({ ...paymentData, num_payment: e.target.value })}
              placeholder="Numéro de transaction, chèque..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {paymentData.paiementid === '3' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Émetteur du chèque
                </label>
                <input
                  type="text"
                  value={paymentData.chqemetteur}
                  onChange={(e) => setPaymentData({ ...paymentData, chqemetteur: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banque du chèque
                </label>
                <input
                  type="text"
                  value={paymentData.chqbank}
                  onChange={(e) => setPaymentData({ ...paymentData, chqbank: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commentaire
            </label>
            <textarea
              value={paymentData.comment}
              onChange={(e) => setPaymentData({ ...paymentData, comment: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Note sur le paiement..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
