'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Wrench, AlertCircle, Loader } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('admin@atelier.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rediriger si déjà connecté
  if (!authLoading && isAuthenticated) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Vérification de la session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2">
              <Wrench className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Atelier</h1>
            </div>
          </div>

          {/* Titre */}
          <h2 className="text-center text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
            Connexion
          </h2>
          <p className="text-center text-sm text-gray-600 dark:text-slate-400 mb-6">
            Veuillez vous connecter pour accéder à l'application
          </p>

          {/* Erreur */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@atelier.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
                required
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-800 dark:text-slate-100"
                required
              />
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Utilisateurs de démo */}
          <div className="pt-6 border-t border-gray-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-3">Comptes de production:</p>
            <div className="space-y-2 text-xs text-gray-600 dark:text-slate-400">
              <div>
                <p className="font-medium text-gray-700 dark:text-slate-300">Admin</p>
                <p>admin@atelier.com / admin123</p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-slate-300">Technicien</p>
                <p>technicien@atelier.com / tech123</p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-slate-300">Gestionnaire Stock</p>
                <p>stock@atelier.com / stock123</p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-slate-300">Gestionnaire Finance</p>
                <p>finance@atelier.com / finance123</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 dark:text-slate-400 mt-6">
          © 2026 Atelier Informatique - Tous droits réservés
        </p>
      </div>
    </div>
  );
}
