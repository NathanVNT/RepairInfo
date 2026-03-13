'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

type DolibarrUser = {
  id: string;
  dolibarrUserId: number;
  login: string;
  nom: string;
  email: string;
  role: 'admin' | 'technicien';
};

export default function UsersPageWrapper() {
  return (
    <ProtectedRoute requiredRole="admin">
      <UsersPage />
    </ProtectedRoute>
  );
}

function UsersPage() {
  const [users, setUsers] = useState<DolibarrUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/auth/users');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Erreur de chargement des utilisateurs');
        }

        setUsers(Array.isArray(data.users) ? data.users : []);
      } catch (err: any) {
        setError(err?.message || 'Erreur serveur');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Utilisateurs Dolibarr</h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">Affichage des comptes actifs depuis la base Dolibarr</p>

          {loading && <p className="mt-6 text-gray-600 dark:text-slate-400">Chargement...</p>}
          {error && <p className="mt-6 text-red-600 dark:text-red-400">{error}</p>}

          {!loading && !error && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700">
                    <th className="py-3 pr-4 text-gray-700 dark:text-slate-300">ID</th>
                    <th className="py-3 pr-4 text-gray-700 dark:text-slate-300">Login</th>
                    <th className="py-3 pr-4 text-gray-700 dark:text-slate-300">Nom</th>
                    <th className="py-3 pr-4 text-gray-700 dark:text-slate-300">Email</th>
                    <th className="py-3 pr-4 text-gray-700 dark:text-slate-300">Rôle App</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 dark:border-slate-800">
                      <td className="py-3 pr-4 text-gray-900 dark:text-slate-100">{user.dolibarrUserId}</td>
                      <td className="py-3 pr-4 text-gray-900 dark:text-slate-100">{user.login}</td>
                      <td className="py-3 pr-4 text-gray-900 dark:text-slate-100">{user.nom}</td>
                      <td className="py-3 pr-4 text-gray-900 dark:text-slate-100">{user.email || '-'}</td>
                      <td className="py-3 pr-4 text-gray-900 dark:text-slate-100">{user.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
