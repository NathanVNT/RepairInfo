'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Building2, User } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { DolibarrThirdParty } from '@/types';

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingClient, setLoadingClient] = useState(true);
  const [clientType, setClientType] = useState<'particulier' | 'entreprise'>('particulier');

  const [formData, setFormData] = useState({
    name: '',
    name_alias: '',
    siren: '',
    siret: '',
    tva_intra: '',
    email: '',
    phone: '',
    phone_mobile: '',
    address: '',
    zip: '',
    town: '',
    country_code: 'FR',
    note_private: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadClient = async () => {
      setLoadingClient(true);
      setLoadError(null);

      try {
        const response = await fetch(`/api/clients/${clientId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur lors du chargement du client');
        }

        const client: DolibarrThirdParty & { phone_mobile?: string; note_private?: string } = await response.json();

        setFormData({
          name: client.name || '',
          name_alias: client.name_alias || '',
          siren: client.siren || '',
          siret: client.siret || '',
          tva_intra: client.tva_intra || '',
          email: client.email || '',
          phone: client.phone || '',
          phone_mobile: client.phone_mobile || '',
          address: client.address || '',
          zip: client.zip || '',
          town: client.town || '',
          country_code: client.country_code || 'FR',
          note_private: client.note_private || '',
        });

        const hasCompanyIdentifiers = Boolean(client.siret || client.siren || client.tva_intra);
        setClientType((client.name_alias && client.name_alias !== client.name) || hasCompanyIdentifiers ? 'entreprise' : 'particulier');
      } catch (error: any) {
        console.error('Erreur chargement client:', error);
        setLoadError(error?.message || 'Erreur de chargement');
      } finally {
        setLoadingClient(false);
      }
    };

    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Le nom est requis';
    }

    if (clientType === 'entreprise') {
      if (!formData.siret.trim()) {
        nextErrors.siret = 'Le SIRET est requis pour une entreprise';
      } else if (!/^\d{14}$/.test(formData.siret.replace(/\s/g, ''))) {
        nextErrors.siret = 'Le SIRET doit contenir 14 chiffres';
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Email invalide';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        name_alias: formData.name_alias || undefined,
        siren: clientType === 'entreprise' ? (formData.siren.replace(/\s/g, '') || undefined) : undefined,
        siret: clientType === 'entreprise' ? (formData.siret.replace(/\s/g, '') || undefined) : undefined,
        tva_intra: clientType === 'entreprise' ? (formData.tva_intra || undefined) : undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        phone_mobile: formData.phone_mobile || undefined,
        address: formData.address || undefined,
        zip: formData.zip || undefined,
        town: formData.town || undefined,
        country_code: formData.country_code || 'FR',
        client: '1',
        note_private: formData.note_private || undefined,
      };

      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la mise à jour du client');
      }

      router.push(`/clients/${clientId}`);
    } catch (error: any) {
      console.error('Erreur mise a jour client:', error);
      alert(`Erreur: ${error?.message || 'Impossible de modifier le client'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4" />
          <p className="text-gray-600">Chargement du client...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-xl">
          <p className="text-red-600">{loadError}</p>
          <Link href="/clients" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
            Retour aux clients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link href={`/clients/${clientId}`} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Modifier le client</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Type de client</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setClientType('particulier')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  clientType === 'particulier' ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <User className={`h-8 w-8 mx-auto mb-2 ${clientType === 'particulier' ? 'text-primary-600' : 'text-gray-400'}`} />
                <p className="font-medium">Particulier</p>
              </button>
              <button
                type="button"
                onClick={() => setClientType('entreprise')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  clientType === 'entreprise' ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Building2 className={`h-8 w-8 mx-auto mb-2 ${clientType === 'entreprise' ? 'text-primary-600' : 'text-gray-400'}`} />
                <p className="font-medium">Entreprise</p>
              </button>
            </div>
          </Card>

          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
            <div className="space-y-4">
              {clientType === 'entreprise' ? (
                <>
                  <Input
                    label="Nom de l'entreprise *"
                    placeholder="Ex: TechSolutions SARL"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    error={errors.name}
                  />
                  <Input
                    label="Nom commercial"
                    placeholder="Ex: TechSolutions"
                    value={formData.name_alias}
                    onChange={(e) => handleChange('name_alias', e.target.value)}
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="SIRET *"
                      placeholder="12345678901234"
                      value={formData.siret}
                      onChange={(e) => handleChange('siret', e.target.value)}
                      error={errors.siret}
                    />
                    <Input
                      label="SIREN"
                      placeholder="123456789"
                      value={formData.siren}
                      onChange={(e) => handleChange('siren', e.target.value)}
                    />
                  </div>
                  <Input
                    label="TVA intracommunautaire"
                    placeholder="FRXX123456789"
                    value={formData.tva_intra}
                    onChange={(e) => handleChange('tva_intra', e.target.value)}
                  />
                </>
              ) : (
                <Input
                  label="Nom complet *"
                  placeholder="Ex: Dupont Jean"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={errors.name}
                />
              )}
            </div>
          </Card>

          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="email@exemple.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
              />
              <Input
                label="Telephone"
                type="tel"
                placeholder="01 23 45 67 89"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
              <Input
                label="Mobile"
                type="tel"
                placeholder="06 12 34 56 78"
                value={formData.phone_mobile}
                onChange={(e) => handleChange('phone_mobile', e.target.value)}
              />
            </div>
          </Card>

          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Adresse</h2>
            <div className="space-y-4">
              <Input
                label="Adresse"
                placeholder="12 rue de la Republique"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Code postal"
                  placeholder="75001"
                  value={formData.zip}
                  onChange={(e) => handleChange('zip', e.target.value)}
                />
                <Input
                  label="Ville"
                  placeholder="Paris"
                  value={formData.town}
                  onChange={(e) => handleChange('town', e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes internes</h2>
            <textarea
              placeholder="Informations complementaires, preferences..."
              value={formData.note_private}
              onChange={(e) => handleChange('note_private', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </Card>

          <div className="flex gap-4">
            <Button type="button" variant="secondary" onClick={() => router.push(`/clients/${clientId}`)} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
