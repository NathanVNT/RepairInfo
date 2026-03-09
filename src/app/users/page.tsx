'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  nom: string;
  role: string;
  actif: boolean;
  createdAt: string;
}

export default function UsersPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <UsersContent />
    </ProtectedRoute>
  );
}

function UsersContent() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    nom: '',
    role: 'technicien',
    password: '',
    confirmPassword: '',
  });

  const roles = [
    { value: 'admin', label: 'Administrateur' },
    { value: 'technicien', label: 'Technicien' },
    { value: 'gestionnaire_stock', label: 'Gestionnaire Stock' },
    { value: 'gestionnaire_finance', label: 'Gestionnaire Finance' },
    { value: 'client', label: 'Client' },
  ];

  // Charger les utilisateurs
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/auth/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
        } else {
          setError('Erreur lors du chargement des utilisateurs');
        }
      } catch (err) {
        console.error('Error loading users:', err);
        setError('Erreur serveur');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleAddUser = () => {
    setEditingId(null);
    setFormData({
      email: '',
      nom: '',
      role: 'technicien',
      password: '',
      confirmPassword: '',
    });
    setShowForm(true);
  };

  const handleEditUser = (usr: User) => {
    setEditingId(usr.id);
    setFormData({
      email: usr.email,
      nom: usr.nom,
      role: usr.role,
      password: '',
      confirmPassword: '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.nom) {
      setError('Le nom est requis');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!editingId && !formData.password) {
      setError('Le mot de passe est requis pour un nouvel utilisateur');
      return;
    }

    try {
      if (editingId) {
        // Édition
        const response = await fetch(`/api/auth/users/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nom: formData.nom,
            role: formData.role,
            ...(formData.password && { password: formData.password }),
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erreur lors de la mise à jour');
        }

        const data = await response.json();
        setUsers(users.map(u => u.id === editingId ? { ...u, ...data.user, createdAt: u.createdAt } : u));
        setSuccess('Utilisateur modifié');
      } else {
        // Création
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            nom: formData.nom,
            role: formData.role,
            password: formData.password,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erreur lors de la création');
        }

        const data = await response.json();
        setUsers([...users, { ...data.user, actif: true, createdAt: new Date().toISOString() }]);
        setSuccess('Utilisateur créé');
      }

      setShowForm(false);
    } catch (err: any) {
      setError(err?.message || 'Erreur serveur');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser?.id) {
      setError('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        const response = await fetch(`/api/auth/users/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Erreur lors de la suppression');
        }

        setUsers(users.filter(u => u.id !== id));
        setSuccess('Utilisateur supprimé');
      } catch (err: any) {
        setError(err?.message || 'Erreur serveur');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Gestion des utilisateurs</h1>
            <p className="text-gray-600 dark:text-slate-400 mt-2">Gérez les utilisateurs et leurs rôles</p>
          </div>
          <button
            onClick={handleAddUser}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nouvel utilisateur
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-300">{success}</p>
          </div>
        )}

        {/* Formulaire */}
        {showForm && (
          <div className="mb-8 p-6 bg-white dark:bg-slate-900 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6">
              {editingId ? 'Modifier utilisateur' : 'Nouvel utilisateur'}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-slate-100"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Rôle
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-slate-100"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Mot de passe {editingId ? '(laisser vide pour ne pas changer)' : ''}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-slate-100"
                  required={!editingId}
                />
              </div>

              {formData.password && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-slate-100"
                    required={!!formData.password}
                  />
                </div>
              )}

              <div className="sm:col-span-2 flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingId ? 'Mettre à jour' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tableau des utilisateurs */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-slate-100">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-slate-100">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-slate-100">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-slate-100">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((usr) => (
                  <tr
                    key={usr.id}
                    className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-slate-100">{usr.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-slate-100">
                      {usr.nom}
                      {usr.id === currentUser?.id && (
                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
                          (Vous)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100 px-3 py-1 rounded-full text-xs capitalize">
                        {usr.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditUser(usr)}
                          className="p-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(usr.id)}
                          disabled={usr.id === currentUser?.id}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-gray-600 dark:text-slate-400">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
