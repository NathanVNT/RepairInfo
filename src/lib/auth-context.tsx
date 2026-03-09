'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export interface User {
  id: string;
  email: string;
  nom: string;
  role: 'admin' | 'technicien' | 'gestionnaire_stock' | 'gestionnaire_finance' | 'client';
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const rolePermissions: Record<string, string[]> = {
  admin: ['view_dashboard', 'manage_repairs', 'create_repair', 'edit_repair', 'delete_repair', 'manage_stock', 'create_product', 'edit_product', 'delete_product', 'manage_clients', 'create_client', 'edit_client', 'delete_client', 'manage_invoices', 'create_facture', 'edit_facture', 'delete_facture', 'manage_quotes', 'create_devis', 'edit_devis', 'delete_devis', 'manage_users', 'view_financials'],
  technicien: ['view_dashboard', 'manage_repairs', 'create_repair', 'edit_repair', 'use_stock_pieces', 'edit_stock', 'view_clients', 'view_financials'],
  gestionnaire_stock: ['view_dashboard', 'manage_stock', 'create_product', 'edit_product', 'edit_stock', 'view_repairs'],
  gestionnaire_finance: ['view_dashboard', 'manage_invoices', 'create_facture', 'edit_facture', 'manage_quotes', 'create_devis', 'view_repairs', 'view_clients'],
  client: ['view_own_repairs'],
};

const defaultUsers: User[] = [
  { id: '1', email: 'admin@atelier.com', nom: 'Administrateur', role: 'admin' },
  { id: '2', email: 'technicien@atelier.com', nom: 'Technicien', role: 'technicien' },
  { id: '3', email: 'stock@atelier.com', nom: 'Gestionnaire Stock', role: 'gestionnaire_stock' },
  { id: '4', email: 'finance@atelier.com', nom: 'Gestionnaire Finance', role: 'gestionnaire_finance' },
];

const defaultPasswords: Record<string, string> = {
  '1': 'admin123',
  '2': 'tech123',
  '3': 'stock123',
  '4': 'finance123',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // Initialize defaults if not present
      const existingUsers = localStorage.getItem('atelier-users');
      const existingPasswords = localStorage.getItem('atelier-passwords');

      if (!existingUsers) {
        localStorage.setItem('atelier-users', JSON.stringify(defaultUsers));
      }
      if (!existingPasswords) {
        localStorage.setItem('atelier-passwords', JSON.stringify(defaultPasswords));
      }

      // Check if user is logged in
      const savedUser = localStorage.getItem('atelier-auth-user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const usersStr = localStorage.getItem('atelier-users');
      const passwordsStr = localStorage.getItem('atelier-passwords');

      if (!usersStr || !passwordsStr) {
        throw new Error('Système d\'authentification indisponible');
      }

      const users: User[] = JSON.parse(usersStr);
      const passwords: Record<string, string> = JSON.parse(passwordsStr);

      const foundUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

      if (!foundUser) {
        throw new Error('Email ou mot de passe incorrect');
      }

      const userPassword = passwords[foundUser.id];
      if (!userPassword || userPassword !== password) {
        throw new Error('Email ou mot de passe incorrect');
      }

      localStorage.setItem('atelier-auth-user', JSON.stringify(foundUser));
      setUser(foundUser);
    } catch (error: any) {
      throw new Error(error?.message || 'Erreur lors de la connexion');
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('atelier-auth-user');
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const permissions = rolePermissions[user.role] || [];
    return permissions.includes(permission);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasRole,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
