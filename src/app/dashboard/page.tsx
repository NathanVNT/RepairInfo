'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wrench,
  Package,
  FileText,
  Users,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Euro
} from 'lucide-react';

interface DashboardStats {
  reparations: {
    total: number;
    enCours: number;
    termineesSemaine: number;
    evolution: number;
  };
  stock: {
    total: number;
    alertes: number;
    rupture: number;
    valeur: number;
  };
  finances: {
    caMois: number;
    caMoisPrecedent: number;
    facturesImpayees: number;
    montantImpaye: number;
  };
  clients: {
    total: number;
    actifs: number;
  };
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats>({
    reparations: { total: 0, enCours: 0, termineesSemaine: 0, evolution: 0 },
    stock: { total: 0, alertes: 0, rupture: 0, valeur: 0 },
    finances: { caMois: 0, caMoisPrecedent: 0, facturesImpayees: 0, montantImpaye: 0 },
    clients: { total: 0, actifs: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const [reparationsRes, produitsRes, facturesRes, clientsRes] = await Promise.all([
          fetch('/api/reparations?limit=1000'),
          fetch('/api/produits?limit=1000'),
          fetch('/api/factures?limit=1000'),
          fetch('/api/clients?limit=1000'),
        ]);

        if (!reparationsRes.ok || !produitsRes.ok || !facturesRes.ok || !clientsRes.ok) {
          throw new Error('Impossible de charger les données du tableau de bord');
        }

        const [reparations, produits, factures, clients] = await Promise.all([
          reparationsRes.json(),
          produitsRes.json(),
          facturesRes.json(),
          clientsRes.json(),
        ]);

        // Réparations
        const reparationsEnCours = Array.isArray(reparations)
          ? reparations.filter((r: any) => !['terminee', 'livree', 'annulee'].includes(String(r?.statut || '')))
          : [];
        
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const termineesSemaine = reparationsEnCours.filter((r: any) => {
          if (!r.date_fin) return false;
          const dateEnd = new Date(r.date_fin);
          return dateEnd >= weekAgo && dateEnd <= today;
        }).length;

        // Stock
        const stock = Array.isArray(produits) ? produits : [];
        const alertes = stock.filter((p: any) =>
          (p.stock_reel || 0) > 0 && (p.stock_reel || 0) <= (p.seuil_stock_alerte || 0)
        ).length;
        const rupture = stock.filter((p: any) => (p.stock_reel || 0) === 0).length;
        const valeur = stock.reduce(
          (sum: number, p: any) => sum + ((p.stock_reel || 0) * (p.price || 0)),
          0
        );

        // Finances
        const facturesTotales = Array.isArray(factures) ? factures : [];
        const today_str = today.toISOString().split('T')[0];
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const monthAgoStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
        const monthAgoEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];

        const caMois = facturesTotales
          .filter((f: any) => {
            const dateStr = new Date((f.date || f.date_creation) * 1000).toISOString().split('T')[0];
            return dateStr >= monthStart && dateStr <= today_str;
          })
          .reduce((sum: number, f: any) => sum + (parseFloat(f.total_ttc || 0)), 0);

        const caMoisPrecedent = facturesTotales
          .filter((f: any) => {
            const dateStr = new Date((f.date || f.date_creation) * 1000).toISOString().split('T')[0];
            return dateStr >= monthAgoStart && dateStr <= monthAgoEnd;
          })
          .reduce((sum: number, f: any) => sum + (parseFloat(f.total_ttc || 0)), 0);

        const facturesImpayees = facturesTotales.filter(
          (f: any) => String(f.statut) === '1' && String(f.paye) !== '1'
        ).length;

        const montantImpaye = facturesTotales
          .filter((f: any) => String(f.statut) === '1' && String(f.paye) !== '1')
          .reduce((sum: number, f: any) => sum + (parseFloat(f.total_ttc || 0)), 0);

        // Clients
        const clientsActifs = Array.isArray(clients)
          ? clients.filter((c: any) => ['1', '3'].includes(String(c?.client)))
          : [];

        const evolution = caMoisPrecedent > 0
          ? Math.round(((caMois - caMoisPrecedent) / caMoisPrecedent) * 100)
          : 0;

        setStats({
          reparations: {
            total: reparations.length || 0,
            enCours: reparationsEnCours.length,
            termineesSemaine,
            evolution,
          },
          stock: {
            total: stock.length,
            alertes,
            rupture,
            valeur,
          },
          finances: {
            caMois,
            caMoisPrecedent,
            facturesImpayees,
            montantImpaye,
          },
          clients: {
            total: clients.length || 0,
            actifs: clientsActifs.length,
          },
        });
      } catch (err: any) {
        console.error('Erreur dashboard:', err);
        setError(err?.message || 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Tableau de bord</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600 dark:text-slate-300">Chargement des données...</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Vue d'ensemble */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Vue d'ensemble</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Réparations */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <Wrench className="h-8 w-8" />
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white bg-opacity-30">
                      {stats.reparations.evolution > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {stats.reparations.evolution > 0 ? '+' : ''}{stats.reparations.evolution}%
                    </span>
                  </div>
                  <div className="text-3xl font-bold mb-2">{stats.reparations.enCours}</div>
                  <div className="text-blue-100 text-sm">Réparations en cours</div>
                  <div className="mt-4 pt-4 border-t border-blue-400">
                    <div className="text-xs text-blue-100">
                      {stats.reparations.termineesSemaine} terminées cette semaine
                    </div>
                  </div>
                </div>

                {/* Stock */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <Package className="h-8 w-8" />
                    {stats.stock.alertes > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-500">
                        {stats.stock.alertes} alertes
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-bold mb-2">{stats.stock.total}</div>
                  <div className="text-green-100 text-sm">Produits en stock</div>
                  <div className="mt-4 pt-4 border-t border-green-400">
                    <div className="text-xs text-green-100">
                      Valeur: {stats.stock.valeur.toFixed(2)}€
                    </div>
                  </div>
                </div>

                {/* Finances */}
                <div className="bg-gradient-to-br from-sky-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <Euro className="h-8 w-8" />
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white bg-opacity-30`}>
                      {stats.finances.caMois >= stats.finances.caMoisPrecedent ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {stats.finances.caMoisPrecedent > 0
                        ? Math.round(((stats.finances.caMois - stats.finances.caMoisPrecedent) / stats.finances.caMoisPrecedent) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="text-3xl font-bold mb-2">{stats.finances.caMois.toFixed(2)}€</div>
                  <div className="text-blue-100 text-sm">CA du mois</div>
                  <div className="mt-4 pt-4 border-t border-blue-400">
                    <div className="text-xs text-blue-100">
                      {stats.finances.facturesImpayees} factures impayées
                    </div>
                  </div>
                </div>

                {/* Clients */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="h-8 w-8" />
                  </div>
                  <div className="text-3xl font-bold mb-2">{stats.clients.actifs}</div>
                  <div className="text-orange-100 text-sm">Clients actifs</div>
                  <div className="mt-4 pt-4 border-t border-orange-400">
                    <div className="text-xs text-orange-100">
                      {stats.clients.total} clients au total
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alertes et Activité récente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Alertes */}
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Alertes</h3>
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div className="space-y-3">
                  {stats.stock.alertes > 0 && (
                    <Link href="/stock?filter=alert" className="block p-3 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded-lg transition-colors">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                            {stats.stock.alertes} produit{stats.stock.alertes > 1 ? 's' : ''} en alerte de stock
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                            Stock faible détecté
                          </p>
                        </div>
                      </div>
                    </Link>
                  )}
                  
                  {stats.stock.rupture > 0 && (
                    <Link href="/stock?filter=rupture" className="block p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                            {stats.stock.rupture} produit{stats.stock.rupture > 1 ? 's' : ''} en rupture de stock
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                            Réapprovisionnement nécessaire
                          </p>
                        </div>
                      </div>
                    </Link>
                  )}

                  {stats.finances.facturesImpayees > 0 && (
                    <Link href="/factures?status=unpaid" className="block p-3 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 rounded-lg transition-colors">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                            {stats.finances.facturesImpayees} facture{stats.finances.facturesImpayees > 1 ? 's' : ''} impayée{stats.finances.facturesImpayees > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                            Montant: {stats.finances.montantImpaye.toFixed(2)}€
                          </p>
                        </div>
                      </div>
                    </Link>
                  )}

                  {stats.stock.alertes === 0 && stats.stock.rupture === 0 && stats.finances.facturesImpayees === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-slate-400">Aucune alerte pour le moment</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistiques rapides */}
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Synthèse</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-slate-300">Réparations totales</span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100">{stats.reparations.total}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-slate-300">CA mois précédent</span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100">{stats.finances.caMoisPrecedent.toFixed(2)}€</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-slate-300">Montant impayé</span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100 text-orange-600 dark:text-orange-400">{stats.finances.montantImpaye.toFixed(2)}€</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-slate-300">Ruptures de stock</span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100 text-red-600 dark:text-red-400">{stats.stock.rupture}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Liens rapides */}
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Liens rapides</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                  href="/reparations/nouveau"
                  className="p-4 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-center"
                >
                  <Wrench className="h-6 w-6 mx-auto mb-2 text-gray-400 dark:text-slate-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Nouvelle réparation</span>
                </Link>
                <Link
                  href="/factures/nouveau"
                  className="p-4 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-center"
                >
                  <FileText className="h-6 w-6 mx-auto mb-2 text-gray-400 dark:text-slate-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Nouvelle facture</span>
                </Link>
                <Link
                  href="/clients/nouveau"
                  className="p-4 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-center"
                >
                  <Users className="h-6 w-6 mx-auto mb-2 text-gray-400 dark:text-slate-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Nouveau client</span>
                </Link>
                <Link
                  href="/stock/nouveau"
                  className="p-4 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-center"
                >
                  <Package className="h-6 w-6 mx-auto mb-2 text-gray-400 dark:text-slate-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Nouveau produit</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
