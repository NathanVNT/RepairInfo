'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Building2,
  User
} from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = 'Le nom est requis';
    }
    if (clientType === 'entreprise') {
      if (!formData.siret.trim()) {
        newErrors.siret = 'Le SIRET est requis pour une entreprise';
      } else if (!/^\d{14}$/.test(formData.siret.replace(/\s/g, ''))) {
        newErrors.siret = 'Le SIRET doit contenir 14 chiffres';
      }
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
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
      const clientData = {
        name: formData.name,
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
        country_code: formData.country_code,
        client: '1', // 1 = client
        note_private: formData.note_private || undefined,
      };

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du client');
      }

      const newClient = await response.json();
      
      alert('Client créé avec succès dans Dolibarr !');
      router.push(`/clients`);
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      alert(`Erreur: ${error.message || 'Impossible de créer le client dans Dolibarr'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 shadow-sm dark:border-b dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/clients" className="text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Nouveau client</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          {/* Type de client */}
          <Card className="mb-6 dark:border dark:border-slate-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Type de client</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setClientType('particulier')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  clientType === 'particulier'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-300 hover:border-gray-400 dark:border-slate-700 dark:hover:border-slate-500'
                }`}
              >
                <User className={`h-8 w-8 mx-auto mb-2 ${
                  clientType === 'particulier' ? 'text-primary-600' : 'text-gray-400'
                }`} />
                <p className="font-medium text-gray-900 dark:text-slate-100">Particulier</p>
              </button>
              <button
                type="button"
                onClick={() => setClientType('entreprise')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  clientType === 'entreprise'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-300 hover:border-gray-400 dark:border-slate-700 dark:hover:border-slate-500'
                }`}
              >
                <Building2 className={`h-8 w-8 mx-auto mb-2 ${
                  clientType === 'entreprise' ? 'text-primary-600' : 'text-gray-400'
                }`} />
                <p className="font-medium text-gray-900 dark:text-slate-100">Entreprise</p>
              </button>
            </div>
          </Card>

          {/* Informations générales */}
          <Card className="mb-6 dark:border dark:border-slate-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Informations</h2>
            
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

          {/* Contact */}
          <Card className="mb-6 dark:border dark:border-slate-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Contact</h2>
            
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
                label="Téléphone"
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

          {/* Adresse */}
          <Card className="mb-6 dark:border dark:border-slate-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Adresse</h2>
            
            <div className="space-y-4">
              <Input
                label="Adresse"
                placeholder="12 rue de la République"
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

          {/* Notes */}
          <Card className="mb-6 dark:border dark:border-slate-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Notes internes</h2>
            
            <textarea
              placeholder="Informations complémentaires, préférences..."
              value={formData.note_private}
              onChange={(e) => handleChange('note_private', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
            />
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
                  Créer le client
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
