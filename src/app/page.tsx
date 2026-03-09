'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { 
  Wrench,
  Package, 
  FileText, 
  Users, 
  BarChart3,
  ArrowRight 
} from 'lucide-react';

type HomeQuickStats = {
  reparationsEnCours: number;
  produitsEnStock: number;
  facturesEnAttente: number;
  clientsActifs: number;
};

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}

function HomeContent() {
  const [quickStats, setQuickStats] = useState<HomeQuickStats>({
    reparationsEnCours: 0,
    produitsEnStock: 0,
    facturesEnAttente: 0,
    clientsActifs: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuickStats = async () => {
      setStatsLoading(true);
      setStatsError(null);

      try {
        const [reparationsRes, produitsRes, facturesRes, clientsRes] = await Promise.all([
          fetch('/api/reparations'),
          fetch('/api/produits?limit=1000&sortfield=ref&sortorder=ASC'),
          fetch('/api/factures?limit=1000&sortfield=t.datef&sortorder=DESC'),
          fetch('/api/clients?limit=1000&sortfield=t.nom&sortorder=ASC'),
        ]);

        if (!reparationsRes.ok || !produitsRes.ok || !facturesRes.ok || !clientsRes.ok) {
          throw new Error('Impossible de charger les statistiques.');
        }

        const [reparations, produits, factures, clients] = await Promise.all([
          reparationsRes.json(),
          produitsRes.json(),
          facturesRes.json(),
          clientsRes.json(),
        ]);

        const reparationsEnCours = Array.isArray(reparations)
          ? reparations.filter(
              (r: any) => !['terminee', 'livree', 'annulee'].includes(String(r?.statut || ''))
            ).length
          : 0;

        const produitsEnStock = Array.isArray(produits) ? produits.length : 0;

        const facturesEnAttente = Array.isArray(factures)
          ? factures.filter((f: any) => String(f?.statut) === '1' && String(f?.paye) !== '1').length
          : 0;

        const clientsActifs = Array.isArray(clients)
          ? clients.filter((c: any) => ['1', '3'].includes(String(c?.client))).length
          : 0;

        setQuickStats({
          reparationsEnCours,
          produitsEnStock,
          facturesEnAttente,
          clientsActifs,
        });
      } catch (error: any) {
        console.error('Erreur lors du chargement de l\'apercu rapide:', error);
        setStatsError(error?.message || 'Erreur lors du chargement des statistiques');
      } finally {
        setStatsLoading(false);
      }
    };

    loadQuickStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Gestion complète de votre atelier
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Interface moderne connectée à Dolibarr pour gérer vos réparations, 
            votre stock, vos factures et vos clients.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Réparations */}
          <Link href="/reparations" className="group">
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-blue-100 rounded-lg w-16 h-16 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Wrench className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Réparations</h3>
              <p className="text-gray-600 mb-4">
                Suivez toutes vos réparations avec historique détaillé et communication client.
              </p>
              <div className="flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all">
                Accéder <ArrowRight className="h-5 w-5 ml-1" />
              </div>
            </div>
          </Link>

          {/* Stock */}
          <Link href="/stock" className="group">
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-green-100 rounded-lg w-16 h-16 flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <Package className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Stock</h3>
              <p className="text-gray-600 mb-4">
                Gérez votre inventaire avec alertes de stock et traçabilité complète.
              </p>
              <div className="flex items-center text-green-600 font-medium group-hover:gap-2 transition-all">
                Accéder <ArrowRight className="h-5 w-5 ml-1" />
              </div>
            </div>
          </Link>

          {/* Factures et Devis */}
          <Link href="/factures" className="group">
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-blue-100 rounded-lg w-16 h-16 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <FileText className="h-8 w-8 text-blue-700" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Factures & Devis</h3>
              <p className="text-gray-600 mb-4">
                Créez et gérez vos factures et devis directement depuis l'interface.
              </p>
              <div className="flex items-center text-blue-700 font-medium group-hover:gap-2 transition-all">
                Accéder <ArrowRight className="h-5 w-5 ml-1" />
              </div>
            </div>
          </Link>

          {/* Clients */}
          <Link href="/clients" className="group">
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-orange-100 rounded-lg w-16 h-16 flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Clients</h3>
              <p className="text-gray-600 mb-4">
                Gérez votre base clients avec historique des réparations et facturation.
              </p>
              <div className="flex items-center text-orange-600 font-medium group-hover:gap-2 transition-all">
                Accéder <ArrowRight className="h-5 w-5 ml-1" />
              </div>
            </div>
          </Link>

          {/* Tableau de bord */}
          <Link href="/dashboard" className="group">
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-indigo-100 rounded-lg w-16 h-16 flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                <BarChart3 className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Tableau de bord</h3>
              <p className="text-gray-600 mb-4">
                Visualisez vos statistiques et indicateurs de performance en temps réel.
              </p>
              <div className="flex items-center text-indigo-600 font-medium group-hover:gap-2 transition-all">
                Accéder <ArrowRight className="h-5 w-5 ml-1" />
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Aperçu rapide</h3>
            {statsLoading && <span className="text-sm text-gray-500">Chargement...</span>}
          </div>

          {statsError && (
            <p className="text-sm text-red-600 mb-4">{statsError}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{quickStats.reparationsEnCours}</div>
              <div className="text-sm text-gray-600">Réparations en cours</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{quickStats.produitsEnStock}</div>
              <div className="text-sm text-gray-600">Produits en stock</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">{quickStats.facturesEnAttente}</div>
              <div className="text-sm text-gray-600">Factures en attente</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">{quickStats.clientsActifs}</div>
              <div className="text-sm text-gray-600">Clients actifs</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600">
            © 2026 Atelier Informatique - Propulsé par Dolibarr
          </p>
        </div>
      </footer>
    </div>
  );
}
