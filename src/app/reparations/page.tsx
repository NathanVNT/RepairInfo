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
  'en_attente': 'bg-gray-100 text-gray-800',
  'diagnostic': 'bg-blue-100 text-blue-800',
  'en_reparation': 'bg-yellow-100 text-yellow-800',
  'en_attente_piece': 'bg-orange-100 text-orange-800',
  'terminee': 'bg-green-100 text-green-800',
  'livree': 'bg-purple-100 text-purple-800',
  'annulee': 'bg-red-100 text-red-800',
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
  'basse': 'text-gray-600',
  'normale': 'text-blue-600',
  'haute': 'text-orange-600',
  'urgente': 'text-red-600',
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
                <ScanButton onScan={handleScan} buttonText="Scanner" />
                <Wrench className="h-8 w-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">Réparations</h1>
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
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par référence, client, appareil..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reparations.filter(r => !['terminee', 'livree', 'annulee'].includes(r.statut)).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Terminées</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reparations.filter(r => r.statut === 'terminee').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attente pièce</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reparations.filter(r => r.statut === 'en_attente_piece').length}
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Urgentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reparations.filter(r => r.priorite === 'urgente').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Reparations List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          ) : filteredReparations.length === 0 ? (
            <div className="p-12 text-center">
              <Wrench className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600">Aucune réparation trouvée</p>
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
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appareil
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priorité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date dépôt
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReparations.map((reparation) => (
                    <tr key={reparation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{reparation.ref}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{reparation.client_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{reparation.appareil}</div>
                        {reparation.marque && (
                          <div className="text-xs text-gray-500">{reparation.marque} {reparation.modele}</div>
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
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(reparation.date_depot).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/reparations/${reparation.id}`}
                          className="text-primary-600 hover:text-primary-900"
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
