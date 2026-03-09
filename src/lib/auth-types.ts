// Types d'authentification et permissions

export type UserRole = 'admin' | 'technicien' | 'gestionnaire_stock' | 'gestionnaire_finance' | 'client';

export interface User {
  id: string;
  email: string;
  nom: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

// Permissions par rôle
export const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    // Tout
    'view_dashboard',
    'manage_users',
    'manage_config',
    'view_reparations',
    'create_reparation',
    'edit_reparation',
    'delete_reparation',
    'view_stock',
    'create_stock',
    'edit_stock',
    'delete_stock',
    'view_factures',
    'create_facture',
    'edit_facture',
    'delete_facture',
    'view_devis',
    'create_devis',
    'edit_devis',
    'delete_devis',
    'view_clients',
    'create_client',
    'edit_client',
  ],
  technicien: [
    'view_dashboard',
    'view_reparations',
    'create_reparation',
    'edit_reparation',
    'view_stock',
    'use_stock_pieces', // Utiliser des pièces du stock pour une réparation
    'edit_stock', // Modifier le stock quand on utilise une pièce
    'view_factures',
    'view_devis',
    'view_clients',
  ],
  gestionnaire_stock: [
    'view_dashboard',
    'view_reparations',
    'view_stock',
    'create_stock',
    'edit_stock',
    'delete_stock',
    'view_factures',
    'view_devis',
    'view_clients',
  ],
  gestionnaire_finance: [
    'view_dashboard',
    'view_reparations',
    'view_stock',
    'view_factures',
    'create_facture',
    'edit_facture',
    'manage_payments',
    'view_devis',
    'create_devis',
    'edit_devis',
    'view_clients',
  ],
  client: [
    'view_dashboard',
    'view_own_reparations',
  ],
};

// Utilisateurs de démo (stockés en localStorage pour le démarrage)
export const defaultUsers: User[] = [
  {
    id: '1',
    email: 'admin@atelier.com',
    nom: 'Administrateur',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'technicien@atelier.com',
    nom: 'Jean Technicien',
    role: 'technicien',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'stock@atelier.com',
    nom: 'Marie Stock',
    role: 'gestionnaire_stock',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    email: 'finance@atelier.com',
    nom: 'Pierre Finance',
    role: 'gestionnaire_finance',
    createdAt: new Date().toISOString(),
  },
];

// Mots de passe de démo (en production, utiliser bcrypt)
export const defaultPasswords: Record<string, string> = {
  'admin@atelier.com': 'admin123',
  'technicien@atelier.com': 'tech123',
  'stock@atelier.com': 'stock123',
  'finance@atelier.com': 'finance123',
};
