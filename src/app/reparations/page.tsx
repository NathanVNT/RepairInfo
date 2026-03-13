'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  ArrowLeft,
  Calendar
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Reparation } from '@/types';
import { reparationService } from '@/lib/reparation-service';
import { ScanButton } from '@/components/BarcodeScanner';

const statutColors: Record<Reparation['statut'], string> = {
  'en_attente': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  'diagnostic': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'en_reparation': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'en_attente_piece': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'terminee': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'livree': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'annulee': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
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

const prioriteColors: Record<Reparation['priorite'], string> = {
  'basse': 'text-gray-600 dark:text-gray-400',
  'normale': 'text-blue-600 dark:text-blue-400',
  'haute': 'text-orange-600 dark:text-orange-400',
  'urgente': 'text-red-600 dark:text-red-400',
};

export default function Reparations() {
  return (
    <ProtectedRoute>
      <ReparationsContent />
    </ProtectedRoute>
  );
}

function ReparationsContent() {
  const router = useRouter();
  const [reparations, setReparations] = useState<Reparation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReparations();
  }, [statutFilter]);

  const loadReparations = async () => {
    setLoading(true);
    try {
      const filters = statutFilter !== 'all' ? { statut: statutFilter } : undefined;
      const data = await reparationService.getReparations(filters);
      setReparations(data);
    } catch (error) {
      console.error('Erreur lors du chargement des réparations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReparations = reparations.filter((rep) =>
    rep.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rep.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rep.appareil.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleScan = async (result: string) => {
    const scanValue = result.trim();

    if (!scanValue) return;

    // Format historique interne: REP:REF:ID
    if (scanValue.startsWith('REP:')) {
      const parts = scanValue.split(':');
      const scannedId = parts[2];
      if (scannedId) {
        router.push(`/reparations/${scannedId}`);
        return;
      }
    }

    // URL de suivi ou de détail générée par QR
    if (scanValue.startsWith('http://') || scanValue.startsWith('https://') || scanValue.startsWith('/')) {
      try {
        const url = new URL(scanValue, window.location.origin);
        if (url.origin === window.location.origin) {
          router.push(`${url.pathname}${url.search}`);
          return;
        }
        window.location.href = url.toString();
        return;
      } catch {
        // Continue vers lookup par référence.
      }
    }

    // Code-barres atelier: référence de réparation (ex: REP-2026-00001)
    const reparation = await reparationService.getReparationByRef(scanValue);
    if (reparation?.id) {
      router.push(`/reparations/${reparation.id}`);
      return;
    }

    alert('Aucune réparation trouvée pour ce code.');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center space-x-3">
                <ScanButton onScan={handleScan} buttonText="Scanner" />
                <Wrench className="h-8 w-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Réparations</h1>
              </div>
            </div>
            <Link
              href="/reparations/nouveau"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouvelle réparation
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher par référence, client, appareil..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="diagnostic">Diagnostic</option>
                <option value="en_reparation">En réparation</option>
                <option value="en_attente_piece">En attente pièce</option>
                <option value="terminee">Terminée</option>
                <option value="livree">Livrée</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">En cours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reparations.filter(r => !['terminee', 'livree', 'annulee'].includes(r.statut)).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Terminées</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reparations.filter(r => r.statut === 'terminee').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Attente pièce</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reparations.filter(r => r.statut === 'en_attente_piece').length}
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Urgentes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reparations.filter(r => r.priorite === 'urgente').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Reparations List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement...</p>
            </div>
          ) : filteredReparations.length === 0 ? (
            <div className="p-12 text-center">
              <Wrench className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">Aucune réparation trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Appareil
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Priorité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date dépôt
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredReparations.map((reparation) => (
                    <tr key={reparation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{reparation.ref}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{reparation.client_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{reparation.appareil}</div>
                        {reparation.marque && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{reparation.marque} {reparation.modele}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statutColors[reparation.statut]}`}>
                          {statutLabels[reparation.statut]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${prioriteColors[reparation.priorite]}`}>
                          {reparation.priorite.charAt(0).toUpperCase() + reparation.priorite.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(reparation.date_depot).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/reparations/${reparation.id}`}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          Voir détails
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
