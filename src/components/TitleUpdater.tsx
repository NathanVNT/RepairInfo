'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAppName } from '@/lib/useAppName';

function formatSegment(value: string): string {
  const normalized = decodeURIComponent(value || '').replace(/[-_]+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getPageTitle(pathname: string): string {
  const path = pathname || '/';

  const exactTitles: Record<string, string> = {
    '/': 'Accueil',
    '/dashboard': 'Tableau de bord',
    '/reparations': 'Reparations',
    '/reparations/nouveau': 'Nouvelle reparation',
    '/stock': 'Stock',
    '/stock/nouveau': 'Nouveau produit',
    '/clients': 'Clients',
    '/clients/nouveau': 'Nouveau client',
    '/devis': 'Devis',
    '/devis/nouveau': 'Nouveau devis',
    '/factures': 'Factures',
    '/factures/nouveau': 'Nouvelle facture',
    '/setup': 'Configuration',
    '/login': 'Connexion',
    '/users': 'Utilisateurs',
  };

  if (exactTitles[path]) {
    return exactTitles[path];
  }

  if (path.startsWith('/suivi/')) return 'Suivi reparation';
  if (path.startsWith('/reparations/')) return 'Fiche reparation';
  if (path.startsWith('/stock/')) return 'Fiche produit';
  if (path.startsWith('/clients/')) {
    if (path.endsWith('/edit')) return 'Modifier client';
    return 'Fiche client';
  }
  if (path.startsWith('/devis/')) return 'Fiche devis';
  if (path.startsWith('/factures/')) return 'Fiche facture';

  const segments = path.split('/').filter(Boolean);
  if (segments.length > 0) {
    return formatSegment(segments[segments.length - 1]);
  }

  return 'Accueil';
}

export function TitleUpdater() {
  const { appName, mounted } = useAppName();
  const pathname = usePathname();

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const pageTitle = getPageTitle(pathname || '/');
      document.title = pageTitle ? `${appName} - ${pageTitle}` : appName;
    }
  }, [appName, mounted, pathname]);

  return null;
}
