'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Search,
  Scan,
  AlertCircle
} from 'lucide-react';
import { Button, Input, Select, Textarea, Card } from '@/components/ui';
import { ScanButton } from '@/components/BarcodeScanner';
import { reparationService } from '@/lib/reparation-service';
import { DolibarrThirdParty } from '@/types';

export default function NewReparationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<DolibarrThirdParty[]>([]);
  const [searchClient, setSearchClient] = useState('');
  const [showClientSearch, setShowClientSearch] = useState(false);

  // Données du formulaire
  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    appareil: '',
    marque: '',
    modele: '',
    numero_serie: '',
    description_panne: '',
    date_depot: new Date().toISOString().split('T')[0],
    date_prevue: '',
    statut: 'en_attente' as const,
    priorite: 'normale' as const,
    montant_estime: '',
    note_interne: '',
    note_client: '',
    notification_statut: false,
    notification_documents: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients?limit=100');
      
      if (!response.ok) {
        throw new Error('Erreur de chargement');
      }

      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      setClients([]);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const selectClient = (client: DolibarrThirdParty) => {
    setFormData(prev => ({
      ...prev,
      client_id: client.id,
      client_name: client.name,
    }));
    setShowClientSearch(false);
    setSearchClient('');
  };

  const handleSerialScan = (code: string) => {
    handleChange('numero_serie', code);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.client_id) {
      newErrors.client_id = 'Le client est requis';
    }
    if (!formData.appareil) {
      newErrors.appareil = 'Le type d\'appareil est requis';
    }
    if (!formData.description_panne) {
      newErrors.description_panne = 'La description de la panne est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const reparationData = {
        client_id: formData.client_id,
        client_name: formData.client_name,
        appareil: formData.appareil,
        marque: formData.marque || undefined,
        modele: formData.modele || undefined,
        numero_serie: formData.numero_serie || undefined,
        description_panne: formData.description_panne,
        date_depot: formData.date_depot,
        date_prevue: formData.date_prevue || undefined,
        statut: formData.statut,
        priorite: formData.priorite,
        montant_estime: formData.montant_estime ? parseFloat(formData.montant_estime) : undefined,
        note_interne: formData.note_interne || undefined,
        note_client: formData.note_client || undefined,
        notification_statut: formData.notification_statut,
        notification_documents: formData.notification_documents,
      };

      const newReparation = await reparationService.createReparation(reparationData);
      
      // Rediriger vers la page de détail
      router.push(`/reparations/${newReparation.id}`);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création de la réparation');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchClient.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchClient.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 shadow-sm dark:border-b dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/reparations" className="text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Nouvelle réparation</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          {/* Informations Client */}
          <Card className="mb-6 dark:border dark:border-slate-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Informations Client</h2>
            
            <div className="space-y-4">
              {/* Client sélectionné */}
              {formData.client_id ? (
                <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-slate-100">{formData.client_name}</p>
                      <p className="text-sm text-gray-600 dark:text-slate-400">Client sélectionné</p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, client_id: '', client_name: '' }));
                        setShowClientSearch(true);
                      }}
                    >
                      Changer
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => setShowClientSearch(!showClientSearch)}
                  >
                    <Search className="h-5 w-5 mr-2" />
                    Rechercher un client
                  </Button>
                  {errors.client_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>
                  )}
                </div>
              )}

              {/* Zone de recherche client */}
              {showClientSearch && !formData.client_id && (
                <div className="border border-gray-300 dark:border-slate-700 rounded-lg p-4 dark:bg-slate-800/50">
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou email..."
                    value={searchClient}
                    onChange={(e) => setSearchClient(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  />
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredClients.map(client => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => selectClient(client)}
                        className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-700 transition-colors"
                      >
                        <p className="font-medium text-gray-900 dark:text-slate-100">{client.name}</p>
                        {client.email && (
                          <p className="text-sm text-gray-600 dark:text-slate-400">{client.email}</p>
                        )}
                      </button>
                    ))}
                    {filteredClients.length === 0 && (
                      <p className="text-center text-gray-500 dark:text-slate-400 py-4">Aucun client trouvé</p>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <Link 
                      href="/clients/nouveau"
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Créer un nouveau client
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Informations Appareil */}
          <Card className="mb-6 dark:border dark:border-slate-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Informations Appareil</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Type d'appareil *"
                placeholder="Ex: Ordinateur portable, PC fixe, Téléphone..."
                value={formData.appareil}
                onChange={(e) => handleChange('appareil', e.target.value)}
                error={errors.appareil}
              />

              <Input
                label="Marque"
                placeholder="Ex: Dell, HP, Samsung..."
                value={formData.marque}
                onChange={(e) => handleChange('marque', e.target.value)}
              />

              <Input
                label="Modèle"
                placeholder="Ex: Latitude 5520"
                value={formData.modele}
                onChange={(e) => handleChange('modele', e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Numéro de série
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="S/N..."
                    value={formData.numero_serie}
                    onChange={(e) => handleChange('numero_serie', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  />
                  <ScanButton
                    onScan={handleSerialScan}
                    buttonText=""
                    className="px-3"
                  />
                </div>
              </div>
            </div>

            <Textarea
              label="Description de la panne *"
              placeholder="Décrivez le problème constaté..."
              value={formData.description_panne}
              onChange={(e) => handleChange('description_panne', e.target.value)}
              error={errors.description_panne}
              rows={4}
              className="mt-4"
            />
          </Card>

          {/* Paramètres de la réparation */}
          <Card className="mb-6 dark:border dark:border-slate-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Paramètres</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Date de dépôt"
                type="date"
                value={formData.date_depot}
                onChange={(e) => handleChange('date_depot', e.target.value)}
              />

              <Input
                label="Date prévue de fin"
                type="date"
                value={formData.date_prevue}
                onChange={(e) => handleChange('date_prevue', e.target.value)}
              />

              <Select
                label="Statut"
                value={formData.statut}
                onChange={(e) => handleChange('statut', e.target.value)}
                options={[
                  { value: 'en_attente', label: 'En attente' },
                  { value: 'diagnostic', label: 'Diagnostic' },
                  { value: 'en_reparation', label: 'En réparation' },
                  { value: 'en_attente_piece', label: 'En attente pièce' },
                ]}
              />

              <Select
                label="Priorité"
                value={formData.priorite}
                onChange={(e) => handleChange('priorite', e.target.value)}
                options={[
                  { value: 'basse', label: 'Basse' },
                  { value: 'normale', label: 'Normale' },
                  { value: 'haute', label: 'Haute' },
                  { value: 'urgente', label: 'Urgente' },
                ]}
              />

              <Input
                label="Montant estimé (€)"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.montant_estime}
                onChange={(e) => handleChange('montant_estime', e.target.value)}
              />
            </div>
          </Card>

          {/* Notes */}
          <Card className="mb-6 dark:border dark:border-slate-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Notes</h2>
            
            <Textarea
              label="Note interne (non visible par le client)"
              placeholder="Informations techniques, remarques..."
              value={formData.note_interne}
              onChange={(e) => handleChange('note_interne', e.target.value)}
              rows={3}
              className="mb-4"
            />

            <Textarea
              label="Note pour le client"
              placeholder="Recommandations, informations importantes..."
              value={formData.note_client}
              onChange={(e) => handleChange('note_client', e.target.value)}
              rows={3}
            />
          </Card>

          {/* Notifications client */}
          <Card className="mb-6 dark:border dark:border-slate-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Notifications client</h2>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notification_statut}
                  onChange={(e) => handleChange('notification_statut', e.target.checked)}
                  className="mt-0.5 h-4 w-4"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100">Notification changement d'état de la réparation</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Envoie un e-mail au client à chaque changement de statut.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notification_documents}
                  onChange={(e) => handleChange('notification_documents', e.target.checked)}
                  className="mt-0.5 h-4 w-4"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100">Notification devis et factures</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">Envoie un e-mail quand un devis ou une facture est créée.</p>
                </div>
              </label>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Créer la réparation
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
