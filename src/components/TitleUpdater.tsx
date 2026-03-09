'use client';

import { useEffect } from 'react';
import { useAppName } from '@/lib/useAppName';

export function TitleUpdater() {
  const { appName, mounted } = useAppName();

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      document.title = `${appName} - Gestion`;
    }
  }, [appName, mounted]);

  return null;
}
