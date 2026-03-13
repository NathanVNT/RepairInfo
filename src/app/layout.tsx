import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { MobileNav } from '@/components/MobileNav';
import { TitleUpdater } from '@/components/TitleUpdater';
import { AuthProvider } from '@/lib/auth-context';
import { MainWrapper } from '@/components/MainWrapper';
import { SetupGuard } from '@/components/SetupGuard';
import { ToastProvider } from '@/components/ToastProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Atelier Informatique',
  description: 'Application de gestion pour atelier informatique',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const saved = localStorage.getItem('atelier-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch (_) {}
})();`,
          }}
        />
      </head>
      <body className={`${inter.className} bg-gray-50 text-gray-900 transition-colors duration-200`}>
        <AuthProvider>
          <ToastProvider>
            <SetupGuard />
            <TitleUpdater />
            <MobileNav />
            <MainWrapper>
              {children}
            </MainWrapper>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
