'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Save, Trash2 } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { DolibarrProduct } from '@/types';

type ProductFormData = {
  ref: string;
  label: string;
  description: string;
  type: string;
  price: string;
  tva_tx: string;
  stock_reel: string;
  seuil_stock_alerte: string;
  barcode: string;
};

const toNumberString = (value: unknown, fallback = '0'): string => {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? String(parsed) : fallback;
};

export default function EditProduitPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    ref: '',
    label: '',
    description: '',
    type: '0',
    price: '0',
    tva_tx: '20',
    stock_reel: '0',
    seuil_stock_alerte: '0',
    barcode: '',
  });

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/produits/${productId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du chargement du produit');
      }

      const product: DolibarrProduct = await response.json();

      setFormData({
        ref: product.ref || '',
        label: product.label || '',
        description: product.description || '',
        type: String(product.type ?? '0'),
        price: toNumberString(product.price, '0'),
        tva_tx: toNumberString(product.tva_tx, '20'),
        stock_reel: toNumberString(product.stock_reel, '0'),
        seuil_stock_alerte: toNumberString(product.seuil_stock_alerte, '0'),
        barcode: product.barcode || '',
      });
    } catch (fetchError: any) {
      console.error('Erreur chargement produit:', fetchError);
      setError(fetchError.message || 'Impossible de charger le produit');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ref || !formData.label || !formData.price) {
      alert('Veuillez remplir les champs obligatoires.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ref: formData.ref.trim(),
        label: formData.label.trim(),
        description: formData.description.trim() || undefined,
        type: parseInt(formData.type, 10),
        price: parseFloat(formData.price.replace(',', '.')),
        tva_tx: parseFloat(formData.tva_tx.replace(',', '.')),
        stock_reel: parseFloat(formData.stock_reel.replace(',', '.')),
        seuil_stock_alerte: formData.seuil_stock_alerte
          ? parseInt(formData.seuil_stock_alerte, 10)
          : 0,
        barcode: formData.barcode.trim() || undefined,
      };

      if (!Number.isFinite(payload.price) || payload.price < 0) {
        throw new Error('Le prix HT doit etre un nombre valide.');
      }

      if (!Number.isFinite(payload.tva_tx) || payload.tva_tx < 0) {
        throw new Error('La TVA doit etre un nombre valide.');
      }

      if (!Number.isFinite(payload.stock_reel) || payload.stock_reel < 0) {
        throw new Error('La quantite en stock doit etre un nombre valide.');
      }

      const response = await fetch(`/api/produits/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la mise a jour du produit');
      }

      alert('Produit mis a jour avec succes.');
      router.push('/stock');
    } catch (saveError: any) {
      console.error('Erreur mise a jour produit:', saveError);
      alert(`Erreur: ${saveError.message || 'Impossible de mettre a jour le produit'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Etes-vous sur de vouloir supprimer ce produit ? Cette action est irréversible.')) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/produits/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression du produit');
      }

      alert('Produit supprime avec succes.');
      router.push('/stock');
    } catch (deleteError: any) {
      console.error('Erreur suppression produit:', deleteError);
      alert(`Erreur: ${deleteError.message || 'Impossible de supprimer le produit'}`);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4" />
          <p className="text-gray-600">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white shadow-sm rounded-lg p-6">
          <p className="text-red-700 font-medium mb-2">Impossible d'ouvrir le produit</p>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={loadProduct}>Reessayer</Button>
            <Link href="/stock">
              <Button>Retour au stock</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/stock" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">Modifier un produit</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <Card>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informations de base</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference *</label>
                    <input
                      type="text"
                      value={formData.ref}
                      onChange={(e) => setFormData((prev) => ({ ...prev, ref: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="0">Produit</option>
                      <option value="1">Service</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Prix</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix HT *</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="absolute right-3 top-2.5 text-gray-500">EUR</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TVA (%)</label>
                    <select
                      value={formData.tva_tx}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tva_tx: e.target.value }))}
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

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Stock</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantite en stock</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.stock_reel}
                      onChange={(e) => setFormData((prev) => ({ ...prev, stock_reel: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seuil d'alerte stock</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.seuil_stock_alerte}
                      onChange={(e) => setFormData((prev) => ({ ...prev, seuil_stock_alerte: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code-barres / EAN</label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData((prev) => ({ ...prev, barcode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="mt-6 flex justify-between">
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="h-5 w-5 mr-2" />
              {deleting ? 'Suppression...' : 'Supprimer'}
            </Button>
            <div className="flex justify-end space-x-3">
              <Link href="/stock">
                <Button variant="secondary" type="button">Annuler</Button>
              </Link>
              <Button type="submit" disabled={saving}>
                <Save className="h-5 w-5 mr-2" />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
