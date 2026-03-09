'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Edit,
  BarChart
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DolibarrProduct } from '@/types';

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function Stock() {
  return (
    <ProtectedRoute>
      <StockContent />
    </ProtectedRoute>
  );
}

function StockContent() {
  const [products, setProducts] = useState<DolibarrProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'alert' | 'rupture'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/produits?limit=100&sortfield=ref&sortorder=ASC');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du chargement des produits');
      }

      const data = await response.json();
      setProducts(data);
    } catch (error: any) {
      console.error('Erreur lors du chargement des produits:', error);
      setError(error.message || 'Erreur de connexion à Dolibarr');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.label.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === 'alert') {
      return matchesSearch && product.stock_reel !== undefined && 
             product.seuil_stock_alerte !== undefined && 
             product.stock_reel > 0 && 
             product.stock_reel <= product.seuil_stock_alerte;
    }
    
    if (filterType === 'rupture') {
      return matchesSearch && product.stock_reel === 0;
    }

    return matchesSearch;
  });

  const statsAlerte = products.filter(p => 
    p.stock_reel !== undefined && 
    p.seuil_stock_alerte !== undefined && 
    p.stock_reel > 0 && 
    p.stock_reel <= p.seuil_stock_alerte
  ).length;

  const statsRupture = products.filter(p => p.stock_reel === 0).length;

  const totalValue = products.reduce(
    (sum, p) => sum + toNumber(p.stock_reel, 0) * toNumber(p.price, 0),
    0
  );

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
                <Package className="h-8 w-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">Gestion du Stock</h1>
              </div>
            </div>
            <Link
              href="/stock/nouveau"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouveau produit
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total produits</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Alertes stock</p>
                <p className="text-2xl font-bold text-orange-900">{statsAlerte}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rupture de stock</p>
                <p className="text-2xl font-bold text-red-900">{statsRupture}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valeur stock</p>
                <p className="text-2xl font-bold text-green-900">{totalValue.toFixed(2)}€</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par référence ou nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Filter */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filterType === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilterType('alert')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filterType === 'alert'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Alertes ({statsAlerte})
              </button>
              <button
                onClick={() => setFilterType('rupture')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filterType === 'rupture'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rupture ({statsRupture})
              </button>
            </div>
          </div>
        </div>

        {/* Products Table */}
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
                      onClick={loadProducts}
                      className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
                    >
                      Réessayer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600">Aucun produit trouvé</p>
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
                      Désignation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seuil alerte
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix HT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valeur
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => {
                    const isAlert = product.stock_reel !== undefined && 
                                   product.seuil_stock_alerte !== undefined &&
                                   product.stock_reel > 0 && 
                                   product.stock_reel <= product.seuil_stock_alerte;
                    const isRupture = product.stock_reel === 0;
                    const price = toNumber(product.price, 0);
                    const stockValue = toNumber(product.stock_reel, 0) * price;

                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.ref}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{product.label}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${
                              isRupture ? 'text-red-600' : isAlert ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {product.stock_reel || 0}
                            </span>
                            {isAlert && <AlertTriangle className="ml-2 h-4 w-4 text-orange-600" />}
                            {isRupture && <AlertTriangle className="ml-2 h-4 w-4 text-red-600" />}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{product.seuil_stock_alerte || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{price.toFixed(2)}€</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{stockValue.toFixed(2)}€</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <Link
                            href={`/stock/${product.id}`}
                            className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
