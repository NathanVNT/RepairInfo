'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Mail,
  Phone,
  MapPin,
  Edit,
  Wrench,
  FileText,
  Calendar,
  User,
  Building2
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { reparationService } from '@/lib/reparation-service';
import { DolibarrThirdParty, Reparation } from '@/types';

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<DolibarrThirdParty | null>(null);
  const [reparations, setReparations] = useState<Reparation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'infos' | 'reparations' | 'factures'>('infos');

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Charger les infos client
      const clientResponse = await fetch(`/api/clients/${clientId}`);
      
      if (!clientResponse.ok) {
        const errorData = await clientResponse.json();
        throw new Error(errorData.message || 'Erreur lors du chargement du client');
      }

      const clientData = await clientResponse.json();
      setClient(clientData);

      // Charger les réparations du client
      const reparationsData = await reparationService.getReparations({ client_id: clientId });
      setReparations(reparationsData);
    } catch (error: any) {
      console.error('Erreur chargement client:', error);
      setError(error.message || 'Erreur de connexion');
      setClient(null);
      setReparations([]);
    } finally {
      setLoading(false);
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

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Client non trouvé</p>
          <Link href="/clients" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  const isEntreprise = Boolean(
    (client.name_alias && client.name_alias !== client.name) ||
    client.siret ||
    client.siren ||
    client.tva_intra
  );

  const stats = {
    reparationsTotal: reparations.length,
    reparationsEnCours: reparations.filter(r => !['terminee', 'livree', 'annulee'].includes(r.statut)).length,
    caTotal: reparations.reduce((sum, r) => sum + (r.montant_final || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/clients" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                <p className="text-sm text-gray-600">{client.code_client}</p>
              </div>
            </div>
            <Link href={`/clients/${clientId}/edit`}>
              <Button variant="secondary">
                <Edit className="h-5 w-5 mr-2" />
                Modifier
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Réparations totales</p>
                <p className="text-2xl font-bold text-gray-900">{stats.reparationsTotal}</p>
              </div>
              <Wrench className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-gray-900">{stats.reparationsEnCours}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">CA Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.caTotal.toFixed(2)}€</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('infos')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'infos'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Informations
              </button>
              <button
                onClick={() => setActiveTab('reparations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reparations'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Réparations ({reparations.length})
              </button>
              <button
                onClick={() => setActiveTab('factures')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'factures'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Factures
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'infos' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Informations */}
            <Card>
              <div className="flex items-center mb-4">
                {isEntreprise ? (
                  <Building2 className="h-6 w-6 text-primary-600 mr-2" />
                ) : (
                  <User className="h-6 w-6 text-primary-600 mr-2" />
                )}
                <h2 className="text-lg font-semibold text-gray-900">
                  {isEntreprise ? 'Entreprise' : 'Particulier'}
                </h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Nom</p>
                  <p className="font-medium text-gray-900">{client.name}</p>
                </div>
                {client.name_alias && (
                  <div>
                    <p className="text-sm text-gray-600">Nom commercial</p>
                    <p className="font-medium text-gray-900">{client.name_alias}</p>
                  </div>
                )}
                {client.siret && (
                  <div>
                    <p className="text-sm text-gray-600">SIRET</p>
                    <p className="font-medium text-gray-900">{client.siret}</p>
                  </div>
                )}
                {client.siren && (
                  <div>
                    <p className="text-sm text-gray-600">SIREN</p>
                    <p className="font-medium text-gray-900">{client.siren}</p>
                  </div>
                )}
                {client.tva_intra && (
                  <div>
                    <p className="text-sm text-gray-600">TVA intracommunautaire</p>
                    <p className="font-medium text-gray-900">{client.tva_intra}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Code client</p>
                  <p className="font-medium text-gray-900">{client.code_client}</p>
                </div>
              </div>
            </Card>

            {/* Contact */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>
              <div className="space-y-3">
                {client.email && (
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <a href={`mailto:${client.email}`} className="text-primary-600 hover:text-primary-700">
                        {client.email}
                      </a>
                    </div>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Téléphone</p>
                      <a href={`tel:${client.phone}`} className="text-primary-600 hover:text-primary-700">
                        {client.phone}
                      </a>
                    </div>
                  </div>
                )}
                {(client.address || client.town) && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Adresse</p>
                      <p className="text-gray-900">
                        {client.address && <span>{client.address}<br /></span>}
                        {client.zip} {client.town}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'reparations' && (
          <Card>
            {reparations.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Aucune réparation</p>
                <Link href="/reparations/nouveau">
                  <Button>Créer une réparation</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reparations.map(reparation => (
                  <Link
                    key={reparation.id}
                    href={`/reparations/${reparation.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-medium text-gray-900">{reparation.ref}</p>
                          <Badge variant={
                            reparation.statut === 'terminee' ? 'success' : 
                            reparation.statut === 'en_reparation' ? 'warning' : 
                            'info'
                          }>
                            {reparation.statut}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{reparation.appareil}</p>
                        <p className="text-sm text-gray-500">{reparation.description_panne.substring(0, 100)}...</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-gray-500 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(reparation.date_depot).toLocaleDateString('fr-FR')}
                        </p>
                        {reparation.montant_final && (
                          <p className="text-lg font-semibold text-gray-900 mt-1">
                            {reparation.montant_final}€
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'factures' && (
          <Card>
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">Les factures liées apparaîtront ici</p>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
