export type UserRole = 'admin' | 'technicien';

export interface AuthUser {
  id: string;
  dolibarrUserId: number;
  login: string;
  nom: string;
  email: string;
  role: UserRole;
}

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string | string[]) => boolean;
}
