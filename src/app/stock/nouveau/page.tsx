'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Save } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';

export default function NouveauProduitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ref: '',
    label: '',
    description: '',
    type: '0', // 0 = produit, 1 = service
    price: '',
    tva_tx: '20',
    stock_reel: '0',
    seuil_stock_alerte: '5',
    barcode: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.ref || !formData.label || !formData.price) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      const productData = {
        ref: formData.ref,
        label: formData.label,
        description: formData.description || undefined,
        type: parseInt(formData.type),
        price: parseFloat(formData.price),
        tva_tx: parseFloat(formData.tva_tx),
        stock_reel: formData.stock_reel ? parseFloat(formData.stock_reel) : 0,
        seuil_stock_alerte: formData.seuil_stock_alerte ? parseInt(formData.seuil_stock_alerte) : undefined,
        barcode: formData.barcode || undefined,
        status: 1, // Actif
        status_buy: 1, // Peut être acheté
      };

      const response = await fetch('/api/produits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création du produit');
      }

      alert('Produit créé avec succès dans Dolibarr !');
      router.push('/stock');
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      alert(`Erreur: ${error.message || 'Impossible de créer le produit dans Dolibarr'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/stock" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">Nouveau produit</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <Card>
            <div className="space-y-6">
              {/* Informations de base */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de base</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Référence *
                    </label>
                    <input
                      type="text"
                      value={formData.ref}
                      onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
                      placeholder="REF-001"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="0">Produit</option>
                      <option value="1">Service</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Désignation *
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Nom du produit"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description détaillée du produit"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Prix et TVA */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Prix</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix HT *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.00"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="absolute right-3 top-2.5 text-gray-500">€</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TVA (%)
                    </label>
                    <select
                      value={formData.tva_tx}
                      onChange={(e) => setFormData({ ...formData, tva_tx: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="0">0%</option>
                      <option value="5.5">5.5%</option>
                      <option value="10">10%</option>
                      <option value="20">20%</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Stock et code-barres */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Stock</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantite en stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.stock_reel}
                      onChange={(e) => setFormData({ ...formData, stock_reel: e.target.value })}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seuil d'alerte stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.seuil_stock_alerte}
                      onChange={(e) => setFormData({ ...formData, seuil_stock_alerte: e.target.value })}
                      placeholder="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Alerte si le stock descend en dessous
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code-barres / EAN
                    </label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="1234567890123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="mt-6 flex justify-end space-x-3">
            <Link href="/stock">
              <Button variant="secondary" type="button">
                Annuler
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              <Save className="h-5 w-5 mr-2" />
              {loading ? 'Création...' : 'Créer le produit'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
