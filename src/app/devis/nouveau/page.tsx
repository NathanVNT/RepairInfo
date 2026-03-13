'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Plus,
  Trash2
} from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { DolibarrThirdParty } from '@/types';

interface ProposalLine {
  description: string;
  qty: number;
  subprice: number;
  tva_tx: number;
}

function NewDevisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reparationId = searchParams.get('reparationId');
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<DolibarrThirdParty[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [repairRef, setRepairRef] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    socid: '',
    date: new Date().toISOString().split('T')[0],
    fin_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    note_public: '',
    note_private: '',
  });

  const [lines, setLines] = useState<ProposalLine[]>([
    { description: '', qty: 1, subprice: 0, tva_tx: 20 }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (!reparationId) return;

    const loadReparationContext = async () => {
      try {
        const response = await fetch(`/api/reparations/${reparationId}`);
        if (!response.ok) return;

        const reparation = await response.json();
        setRepairRef(reparation.ref);

        setFormData((prev) => ({
          ...prev,
          socid: prev.socid || reparation.client_id,
          note_public:
            prev.note_public ||
            `Réparation liée: ${reparation.ref}\n${reparation.appareil}\nPanne: ${reparation.description_panne}`,
          note_private: prev.note_private || `Réparation liée: ${reparation.ref}`,
        }));

        setLines((prev) => {
          const first = prev[0];
          if (!first || first.description.trim()) return prev;

          const next = [...prev];
          next[0] = {
            ...next[0],
            description: `Réparation ${reparation.ref} - ${reparation.appareil}\n${reparation.description_panne}`,
          };
          return next;
        });
      } catch (error) {
        console.error('Erreur chargement contexte réparation:', error);
      }
    };

    loadReparationContext();
  }, [reparationId]);

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients?limit=1000&sortfield=t.nom&sortorder=ASC');
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

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

  const handleLineChange = (index: number, field: keyof ProposalLine, value: string | number) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const addLine = () => {
    setLines([...lines, { description: '', qty: 1, subprice: 0, tva_tx: 20 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    let total_ht = 0;
    let total_tva = 0;

    lines.forEach(line => {
      const line_ht = line.qty * line.subprice;
      const line_tva = line_ht * (line.tva_tx / 100);
      total_ht += line_ht;
      total_tva += line_tva;
    });

    return {
      total_ht,
      total_tva,
      total_ttc: total_ht + total_tva
    };
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.socid) {
      newErrors.socid = 'Le client est requis';
    }

    if (lines.length === 0 || lines.every(l => !l.description)) {
      newErrors.lines = 'Au moins une ligne est requise';
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
      const proposalData = {
        socid: formData.socid,
        date: Math.floor(new Date(formData.date).getTime() / 1000),
        fin_validite: Math.floor(new Date(formData.fin_validite).getTime() / 1000),
        note_public: formData.note_public || undefined,
        note_private: formData.note_private || undefined,
      };

      // Créer le devis
      const response = await fetch('/api/devis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proposalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du devis');
      }

      const newProposal = await response.json();
      // Dolibarr retourne l'ID directement (nombre ou string)
      const proposalId = String(typeof newProposal === 'object' && newProposal?.id ? newProposal.id : newProposal);
      console.log('Devis créé avec ID:', proposalId);

      // Ajouter les lignes
      for (const line of lines.filter(l => l.description)) {
        const lineResponse = await fetch(`/api/devis/${proposalId}/lines`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            desc: line.description,
            qty: line.qty,
            subprice: line.subprice,
            tva_tx: line.tva_tx,
            product_type: 1, // 0 = produit, 1 = service
          }),
        });

        if (!lineResponse.ok) {
          const errorData = await lineResponse.json();
          console.error('Détails erreur ligne:', errorData);
          throw new Error(`Erreur lors de l'ajout d'une ligne: ${errorData?.details?.error?.message || errorData.message || 'Erreur inconnue'}`);
        }
      }

      if (reparationId) {
        await fetch(`/api/reparations/${reparationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ devis_id: proposalId }),
        });

        await fetch(`/api/reparations/${reparationId}/historique`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'Devis lié',
            description: `Devis Dolibarr lié à la réparation (ID: ${proposalId})`,
            auteur: 'Système',
            visible_client: true,
          }),
        });
      }
      
      alert('Devis créé avec succès dans Dolibarr !');
      router.push(reparationId ? `/reparations/${reparationId}` : '/devis');
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      alert(`Erreur: ${error.message || 'Impossible de créer le devis dans Dolibarr'}`);
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/factures" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Nouveau devis</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          {/* Informations générales */}
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h2>
            {repairRef && (
              <div className="mb-4 p-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-900 text-sm">
                Création liée à la réparation: <span className="font-semibold">{repairRef}</span>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client *
                </label>
                <select
                  value={formData.socid}
                  onChange={(e) => handleChange('socid', e.target.value)}
                  disabled={loadingClients}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.socid ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionnez un client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {errors.socid && (
                  <p className="text-sm text-red-600 mt-1">{errors.socid}</p>
                )}
              </div>

              <Input
                label="Date *"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                error={errors.date}
              />
            </div>

            <div className="mt-4">
              <Input
                label="Date de fin de validité *"
                type="date"
                value={formData.fin_validite}
                onChange={(e) => handleChange('fin_validite', e.target.value)}
                error={errors.fin_validite}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note publique
              </label>
              <textarea
                value={formData.note_public}
                onChange={(e) => handleChange('note_public', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Note visible par le client..."
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note privée
              </label>
              <textarea
                value={formData.note_private}
                onChange={(e) => handleChange('note_private', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Note interne..."
              />
            </div>
          </Card>

          {/* Lignes de devis */}
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Lignes de devis</h2>
              <Button type="button" variant="secondary" onClick={addLine}>
                <Plus className="h-5 w-5 mr-2" />
                Ajouter une ligne
              </Button>
            </div>

            {errors.lines && (
              <p className="text-sm text-red-600 mb-4">{errors.lines}</p>
            )}

            <div className="space-y-4">
              {lines.map((line, index) => (
                <div key={index} className="flex gap-4 items-start p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <Input
                      label="Description"
                      value={line.description}
                      onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                      placeholder="Description du produit/service"
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      label="Qté"
                      type="number"
                      step="0.01"
                      value={line.qty}
                      onChange={(e) => handleLineChange(index, 'qty', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      label="Prix HT"
                      type="number"
                      step="0.01"
                      value={line.subprice}
                      onChange={(e) => handleLineChange(index, 'subprice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      label="TVA %"
                      type="number"
                      step="0.01"
                      value={line.tva_tx}
                      onChange={(e) => handleLineChange(index, 'tva_tx', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="pt-6">
                    {lines.length > 1 && (
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => removeLine(index)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totaux */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total HT:</span>
                    <span className="font-medium">{totals.total_ht.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total TVA:</span>
                    <span className="font-medium">{totals.total_tva.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total TTC:</span>
                    <span>{totals.total_ttc.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/factures">
              <Button type="button" variant="secondary">
                Annuler
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              <Save className="h-5 w-5 mr-2" />
              {loading ? 'Création...' : 'Créer le devis'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function NewDevisPageWrapper() {
  return (
    <Suspense>
      <NewDevisPage />
    </Suspense>
  );
}
