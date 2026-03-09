'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Plus, 
  Search, 
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  Eye,
  FileText
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DolibarrThirdParty } from '@/types';

export default function Clients() {
  return (
    <ProtectedRoute>
      <ClientsContent />
    </ProtectedRoute>
  );
}

function ClientsContent() {
  const [clients, setClients] = useState<DolibarrThirdParty[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/clients?limit=100&sortfield=rowid&sortorder=ASC');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du chargement des clients');
      }

      const data = await response.json();
      setClients(data);
    } catch (error: any) {
      console.error('Erreur lors du chargement des clients:', error);
      setError(error.message || 'Erreur de connexion à Dolibarr');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.code_client?.toLowerCase().includes(searchTerm.toLowerCase())
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
                <Users className="h-8 w-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
              </div>
            </div>
            <Link
              href="/clients/nouveau"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouveau client
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total clients</p>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nouveaux (mois)</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <Plus className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Réparations actives</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">CA total</p>
                <p className="text-2xl font-bold text-gray-900">45,890€</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou code client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Clients Grid */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : error ? (
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
                  onClick={loadClients}
                  className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600">Aucun client trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {client.name}
                    </h3>
                    {client.name_alias && (
                      <p className="text-sm text-gray-500">{client.name_alias}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{client.code_client}</p>
                  </div>
                  <div className="flex-shrink-0 h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary-600" />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {client.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.town && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{client.zip} {client.town}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Link
                    href={`/clients/${client.id}`}
                    className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir le profil
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
