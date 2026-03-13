'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  FileText,
  CheckCircle,
  Calendar,
  Euro,
  Eye,
  XCircle
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { DolibarrProposal } from '@/types';

const statutLabels: Record<string, string> = {
  '0': 'Brouillon',
  '1': 'Validé',
  '2': 'Signé',
  '3': 'Non signé',
  '4': 'Facturé',
};

const statutColors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  '0': 'default',
  '1': 'info',
  '2': 'success',
  '3': 'danger',
  '4': 'warning',
};

export default function DevisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const devisId = params.id as string;

  const [devis, setDevis] = useState<DolibarrProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    loadDevis();
  }, [devisId]);

  const loadDevis = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/devis/${devisId}`);
      if (response.ok) {
        const data = await response.json();
        setDevis(data);
      }
    } catch (error) {
      console.error('Erreur chargement devis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!confirm('Voulez-vous valider ce devis ?')) {
      return;
    }

    setValidating(true);
    try {
      const response = await fetch(`/api/devis/${devisId}/validate`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Devis validé avec succès !');
        await loadDevis();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.message || 'Impossible de valider le devis'}`);
      }
    } catch (error) {
      console.error('Erreur validation devis:', error);
      alert('Erreur lors de la validation du devis');
    } finally {
      setValidating(false);
    }
  };

  const openInDolibarr = () => {
    const dolibarrUrl = process.env.NEXT_PUBLIC_DOLIBARR_URL;
    window.open(`${dolibarrUrl}/comm/propal/card.php?id=${devisId}`, '_blank');
  };

  const handleConvertToInvoice = async () => {
    if (!confirm('Transformer ce devis en facture ?')) {
      return;
    }

    setConverting(true);
    try {
      const response = await fetch(`/api/devis/${devisId}/to-facture`, {
        method: 'POST',
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(`Erreur: ${data?.message || data?.error || 'Transformation impossible'}`);
        return;
      }

      const invoiceId = String(data?.invoice_id || '').trim();
      if (invoiceId) {
        const message = data?.already_billed
          ? 'Ce devis est deja facture. Ouverture de la facture existante.'
          : 'Facture creee avec succes.';
        alert(message);
        router.push(`/factures/${invoiceId}`);
        return;
      }

      alert('Facture creee avec succes.');
      router.push('/factures');
    } catch (error) {
      console.error('Erreur transformation devis en facture:', error);
      alert('Erreur lors de la transformation du devis en facture');
    } finally {
      setConverting(false);
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

  if (!devis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Devis non trouvé</p>
          <Link href="/factures">
            <Button>Retour à la liste</Button>
          </Link>
        </div>
      </div>
    );
  }

  const dateDevis = new Date((devis.date || 0) * 1000);
  const dateCreation = new Date((devis.date_creation || 0) * 1000);
  const finValidite = new Date((devis.fin_validite || 0) * 1000);

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
                <h1 className="text-2xl font-bold text-gray-900">{devis.ref}</h1>
                <p className="text-sm text-gray-600">Devis / Proposition commerciale</p>
              </div>
            </div>
            <div className="flex gap-2">
              {devis.statut !== '4' && (
                <Button onClick={handleConvertToInvoice} disabled={converting}>
                  <FileText className="h-5 w-5 mr-2" />
                  {converting ? 'Transformation...' : 'Transformer en facture'}
                </Button>
              )}
              {devis.statut === '0' && (
                <Button 
                  variant="success" 
                  onClick={handleValidate}
                  disabled={validating}
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {validating ? 'Validation...' : 'Valider le devis'}
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
                <Badge variant={statutColors[devis.statut]}>
                  {statutLabels[devis.statut]}
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date du devis</p>
                  <div className="flex items-center text-gray-900 font-medium">
                    <Calendar className="h-4 w-4 mr-2" />
                    {dateDevis.toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date de création</p>
                  <p className="font-medium">{dateCreation.toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fin de validité</p>
                  <p className="font-medium">{finValidite.toLocaleDateString('fr-FR')}</p>
                </div>
                {devis.date_validation && (
                  <div>
                    <p className="text-sm text-gray-600">Date de validation</p>
                    <p className="font-medium">
                      {new Date(devis.date_validation * 1000).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>

              {devis.note_public && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Note publique</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{devis.note_public}</p>
                </div>
              )}

              {devis.note_private && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Note privée</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{devis.note_private}</p>
                </div>
              )}
            </Card>

            {/* Lignes de devis */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lignes du devis</h2>
              
              {devis.lines && devis.lines.length > 0 ? (
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {devis.lines.map((line, index) => (
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
                  <span className="font-medium">{(parseFloat(devis.total_ht as any) || 0).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total TVA</span>
                  <span className="font-medium">{(parseFloat(devis.total_tva as any) || 0).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between pt-3 border-t text-lg font-bold">
                  <span>Total TTC</span>
                  <span className="text-primary-600">{(parseFloat(devis.total_ttc as any) || 0).toFixed(2)} €</span>
                </div>
                {devis.statut === '2' && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span className="font-medium">Devis signé</span>
                    </div>
                  </div>
                )}
                {devis.statut === '4' && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center text-purple-600">
                      <FileText className="h-5 w-5 mr-2" />
                      <span className="font-medium">Devis facturé</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
