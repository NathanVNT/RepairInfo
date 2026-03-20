import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { clearUser, loadUser, saveUser } from '@/lib/storage';
import { login as loginApi, type AuthUser } from '@/lib/api';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser()
      .then((storedUser) => setUser(storedUser))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (identifier: string, password: string) => {
        const authUser = await loginApi(identifier, password);
        setUser(authUser);
        await saveUser(authUser);
      },
      logout: async () => {
        setUser(null);
        await clearUser();
      },
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
