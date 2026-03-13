'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

function isExcludedPath(pathname: string): boolean {
  return pathname.startsWith('/setup') || pathname.startsWith('/suivi');
}

export function SetupGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const currentPath = pathname || '/';
    if (isExcludedPath(currentPath)) return;

    let cancelled = false;

    const checkSetup = async () => {
      try {
        const response = await fetch('/api/setup/config', { cache: 'no-store' });
        if (!response.ok || cancelled) return;

        const data = await response.json();
        if (cancelled) return;

        const dolibarrUrl = String(data?.dolibarrUrl || '').trim();
        const apiKey = String(data?.apiKey || '').trim();
        const configured = Boolean(dolibarrUrl && apiKey);

        if (!configured) {
          router.replace('/setup');
        }
      } catch {
        // Keep current route if setup check fails temporarily.
      }
    };

    checkSetup();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
