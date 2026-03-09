'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Scan, Home, Package, Wrench, Users, BarChart3, FileText, Settings, LogOut } from 'lucide-react';
import { Button } from './ui';
import { BarcodeScanner } from './BarcodeScanner';
import { ThemeToggle } from './ThemeToggle';
import { useAppName } from '@/lib/useAppName';
import { useAuth } from '@/lib/auth-context';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const router = useRouter();
  const { appName, mounted } = useAppName();
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const handleScan = async (code: string) => {
    setScanning(true);
    try {
      const response = await fetch(`/api/search-code?code=${encodeURIComponent(code)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.type === 'product') {
          router.push(`/stock/${data.id}`);
        } else if (data.type === 'repair') {
          router.push(`/reparations/${data.id}`);
        } else {
          alert(`Code trouvé: ${code}\nMais type inconnu ou non trouvé.`);
        }
      } else {
        alert(`Code "${code}" non trouvé dans le stock ou les réparations.`);
      }
    } catch (error) {
      console.error('Erreur recherche code:', error);
      alert('Erreur lors de la recherche du code.');
    } finally {
      setScanning(false);
      setShowScanner(false);
      setIsOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push('/login');
  };

  const navLinks = [
    { href: '/', label: 'Accueil', icon: Home },
    { href: '/reparations', label: 'Réparations', icon: Wrench },
    { href: '/stock', label: 'Stock', icon: Package },
    { href: '/clients', label: 'Clients', icon: Users },
    { href: '/devis', label: 'Devis', icon: FileText },
    { href: '/factures', label: 'Factures', icon: FileText },
    { href: '/dashboard', label: 'Tableau de bord', icon: BarChart3 },
  ];

  return (
    <>
      {/* Unified Top Navigation */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 py-3">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 font-bold text-base sm:text-lg text-gray-900 dark:text-slate-100 flex-shrink-0">
              <Wrench className="h-6 w-6 text-primary-600" />
              {mounted && (
                <>
                  <span className="hidden sm:inline">{appName}</span>
                  <span className="sm:hidden">{appName.split(' ')[0]}</span>
                </>
              )}
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isAuthenticated && user && (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="flex flex-col items-end text-sm">
                    <span className="font-medium text-gray-900 dark:text-slate-100">{user.nom}</span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">{user.role}</span>
                  </div>
                </div>
              )}
              <Link
                href="/setup"
                className="hidden sm:inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <Settings className="h-4 w-4" />
              </Link>
              <ThemeToggle />
              <button
                onClick={() => setIsOpen(true)}
                className="lg:hidden inline-flex items-center justify-center rounded-lg p-2 text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                aria-label="Ouvrir le menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 shadow-lg z-40">
        <div className="flex items-center justify-around py-3 px-2">
          <Link href="/" className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
            <Home className="h-6 w-6 text-gray-600 dark:text-slate-300" />
            <span className="text-xs text-gray-600 dark:text-slate-300">Accueil</span>
          </Link>
          <Link href="/reparations" className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
            <Wrench className="h-6 w-6 text-gray-600 dark:text-slate-300" />
            <span className="text-xs text-gray-600 dark:text-slate-300">Réparations</span>
          </Link>
          <Button
            onClick={() => setShowScanner(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-lg !bg-primary-600 hover:!bg-primary-700 !text-white !w-auto"
            size="sm"
          >
            <Scan className="h-6 w-6" />
            <span className="text-xs">Scanner</span>
          </Button>
          <Link href="/stock" className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
            <Package className="h-6 w-6 text-gray-600 dark:text-slate-300" />
            <span className="text-xs text-gray-600 dark:text-slate-300">Stock</span>
          </Link>
          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <Menu className="h-6 w-6 text-gray-600 dark:text-slate-300" />
            <span className="text-xs text-gray-600 dark:text-slate-300">Menu</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-slate-900 ml-auto w-64 h-full shadow-lg overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
              <span className="font-bold text-lg text-gray-900 dark:text-slate-100">Menu</span>
              <button onClick={() => setIsOpen(false)}>
                <X className="h-6 w-6 text-gray-700 dark:text-slate-200" />
              </button>
            </div>
            {isAuthenticated && user && (
              <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                <p className="text-sm text-gray-600 dark:text-slate-400">Connecté en tant que</p>
                <p className="font-medium text-gray-900 dark:text-slate-100">{user.nom}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 capitalize">{user.role.replace(/_/g, ' ')}</p>
              </div>
            )}
            <div className="p-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-900 dark:text-slate-100"
                  onClick={() => setIsOpen(false)}
                >
                  <link.icon className="h-5 w-5 text-gray-600 dark:text-slate-300" />
                  <span>{link.label}</span>
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700 space-y-2">
                <Link
                  href="/setup"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-900 dark:text-slate-100"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="h-5 w-5 text-gray-600 dark:text-slate-300" />
                  <span>Configuration</span>
                </Link>
                {isAuthenticated && user?.role === 'admin' && (
                  <Link
                    href="/users"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-900 dark:text-slate-100"
                    onClick={() => setIsOpen(false)}
                  >
                    <Users className="h-5 w-5 text-gray-600 dark:text-slate-300" />
                    <span>Utilisateurs</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    setShowScanner(true);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-900 dark:text-slate-100"
                >
                  <Scan className="h-5 w-5 text-gray-600 dark:text-slate-300" />
                  <span>Scanner</span>
                </button>
                {isAuthenticated && (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Déconnexion</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Scanner Button */}
      <button
        onClick={() => setShowScanner(true)}
        className="fixed bottom-28 lg:bottom-8 right-4 z-30 inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 active:scale-95 transition-all"
        aria-label="Scanner un code"
        title="Scanner"
      >
        <Scan className="h-6 w-6" />
      </button>

      {/* Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          title="Scanner un produit ou une réparation"
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
