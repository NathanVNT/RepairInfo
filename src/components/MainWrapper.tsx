'use client';

import { usePathname } from 'next/navigation';

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavSpacing = pathname === '/login' || pathname?.startsWith('/suivi');
  return (
    <div className={hideNavSpacing ? '' : 'pb-24 lg:pb-0'}>
      {children}
    </div>
  );
}
