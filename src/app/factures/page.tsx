'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Euro,
  Clock,
  CheckCircle,
  ArrowLeft,
  Calendar,
  Eye
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DolibarrInvoice, DolibarrProposal } from '@/types';

type Tab = 'factures' | 'devis';

const statutFactureLabels: Record<string, string> = {
  '0': 'Brouillon',
  '1': 'Validée',
  '2': 'Payée',
  '3': 'Abandonnée',
};

const statutFactureColors: Record<string, string> = {
  '0': 'bg-gray-100 text-gray-800',
  '1': 'bg-blue-100 text-blue-800',
  '2': 'bg-green-100 text-green-800',
  '3': 'bg-red-100 text-red-800',
};

const statutDevisLabels: Record<string, string> = {
  '0': 'Brouillon',
  '1': 'Validé',
  '2': 'Signé',
  '3': 'Non signé',
  '4': 'Facturé',
};

const statutDevisColors: Record<string, string> = {
  '0': 'bg-gray-100 text-gray-800',
  '1': 'bg-blue-100 text-blue-800',
  '2': 'bg-green-100 text-green-800',
  '3': 'bg-red-100 text-red-800',
  '4': 'bg-purple-100 text-purple-800',
};

export default function Factures() {
  return (
    <ProtectedRoute>
      <FacturesContent />
    </ProtectedRoute>
  );
}

function FacturesContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('factures');
  const [factures, setFactures] = useState<DolibarrInvoice[]>([]);
  const [devis, setDevis] = useState<DolibarrProposal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab === 'devis') {
      setActiveTab('devis');
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'factures') {
      loadFactures();
    } else {
      loadDevis();
    }
  }, [activeTab]);

  const loadFactures = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/factures?limit=100&sortfield=t.datef&sortorder=DESC');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du chargement des factures');
      }

      const data = await response.json();
      setFactures(data);
    } catch (error: any) {
      console.error('Erreur lors du chargement des factures:', error);
      setError(error.message || 'Erreur de connexion à Dolibarr');
      setFactures([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDevis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/devis?limit=100&sortfield=t.datep&sortorder=DESC');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du chargement des devis');
      }

      const data = await response.json();
      setDevis(data);
    } catch (error: any) {
      console.error('Erreur lors du chargement des devis:', error);
      setError(error.message || 'Erreur de connexion à Dolibarr');
      setDevis([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredFactures = factures.filter((facture) =>
    facture.ref?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDevis = devis.filter((devisItem) =>
    devisItem.ref?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statsFactures = {
    total: factures.length,
    validees: factures.filter(f => f.statut === '1').length,
    payees: factures.filter(f => f.paye === '1').length,
    montantTotal: factures.reduce((sum, f) => sum + (parseFloat(f.total_ttc as any) || 0), 0),
  };

  const statsDevis = {
    total: devis.length,
    valides: devis.filter(d => d.statut === '1').length,
    signes: devis.filter(d => d.statut === '2').length,
    montantTotal: devis.reduce((sum, d) => sum + (parseFloat(d.total_ttc as any) || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">Factures & Devis</h1>
              </div>
            </div>
            <Link
              href={activeTab === 'factures' ? '/factures/nouveau' : '/devis/nouveau'}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              {activeTab === 'factures' ? 'Nouvelle facture' : 'Nouveau devis'}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('factures')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'factures'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Factures ({factures.length})
              </button>
              <button
                onClick={() => setActiveTab('devis')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'devis'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Devis ({devis.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {activeTab === 'factures' ? (
            <>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{statsFactures.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Validées</p>
                    <p className="text-2xl font-bold text-gray-900">{statsFactures.validees}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Payées</p>
                    <p className="text-2xl font-bold text-gray-900">{statsFactures.payees}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Montant total</p>
                    <p className="text-2xl font-bold text-gray-900">{statsFactures.montantTotal.toFixed(2)}€</p>
                  </div>
                  <Euro className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{statsDevis.total}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Validés</p>
                    <p className="text-2xl font-bold text-gray-900">{statsDevis.valides}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Signés</p>
                    <p className="text-2xl font-bold text-gray-900">{statsDevis.signes}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Montant total</p>
                    <p className="text-2xl font-bold text-gray-900">{statsDevis.montantTotal.toFixed(2)}€</p>
                  </div>
                  <Euro className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800">Erreur de connexion à Dolibarr</h3>
                    <p className="mt-2 text-sm text-red-700">{error}</p>
                    <p className="mt-2 text-sm text-red-600">
                      Vérifiez votre configuration dans le fichier .env.local et assurez-vous que Dolibarr est accessible.
                    </p>
                    <button
                      onClick={activeTab === 'factures' ? loadFactures : loadDevis}
                      className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
                    >
                      Réessayer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'factures' ? (
            filteredFactures.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-600">Aucune facture trouvée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Référence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant HT
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant TTC
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFactures.map((facture) => (
                      <tr key={facture.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{facture.ref}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(facture.date * 1000).toLocaleDateString('fr-FR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statutFactureColors[facture.statut]}`}>
                            {statutFactureLabels[facture.statut]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{(parseFloat(facture.total_ht as any) || 0).toFixed(2)}€</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{(parseFloat(facture.total_ttc as any) || 0).toFixed(2)}€</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/factures/${facture.id}`}
                            className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            filteredDevis.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-600">Aucun devis trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Référence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fin validité
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant TTC
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDevis.map((devisItem) => (
                      <tr key={devisItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{devisItem.ref}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(devisItem.date * 1000).toLocaleDateString('fr-FR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(devisItem.fin_validite * 1000).toLocaleDateString('fr-FR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statutDevisColors[devisItem.statut]}`}>
                            {statutDevisLabels[devisItem.statut]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{(parseFloat(devisItem.total_ttc as any) || 0).toFixed(2)}€</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/devis/${devisItem.id}`}
                            className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}
