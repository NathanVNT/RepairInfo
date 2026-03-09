'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, hasRole, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Si pas connecté, rediriger vers login
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Si un rôle est requis et que l'utilisateur n'a pas ce rôle, refuser l'accès
    if (requiredRole && !hasRole(requiredRole)) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, isLoading, requiredRole, user, hasRole, router]);

  // Afficher loading pendant la vérification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-slate-400">Vérification...</p>
        </div>
      </div>
    );
  }

  // Si pas connecté après loading, ne rien afficher (le useEffect va rediriger)
  if (!isAuthenticated) {
    return null;
  }

  // Si un rôle est requis et pas autorisé
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">Accès refusé</p>
          <p className="text-gray-600 dark:text-slate-400 mt-2">Vous n'avez pas les permissions nécessaires.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
