'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

type ToastType = 'info' | 'success' | 'error';

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  notify: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function inferType(message: string): ToastType {
  const value = String(message || '').toLowerCase();
  if (value.includes('erreur') || value.includes('impossible') || value.includes('echec')) return 'error';
  if (value.includes('succes') || value.includes('succès') || value.includes('valide') || value.includes('ok')) return 'success';
  return 'info';
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message: string, type: ToastType = inferType(message)) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message: String(message || ''), type }]);
    window.setTimeout(() => removeToast(id), 4500);
  }, [removeToast]);

  useEffect(() => {
    const originalAlert = window.alert.bind(window);
    (window as any).__originalAlert = originalAlert;

    window.alert = (message?: unknown) => {
      notify(String(message ?? ''), inferType(String(message ?? '')));
    };

    return () => {
      if ((window as any).__originalAlert) {
        window.alert = (window as any).__originalAlert;
      }
    };
  }, [notify]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 left-4 z-[100] flex max-w-sm flex-col gap-2">
        {toasts.map((toast) => {
          const palette =
            toast.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/60 dark:text-red-100'
              : toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950/60 dark:text-green-100'
              : 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-100';

          const Icon = toast.type === 'error' ? XCircle : toast.type === 'success' ? CheckCircle2 : Info;

          return (
            <div key={toast.id} className={`flex items-start gap-2 rounded-lg border px-3 py-2 shadow-lg backdrop-blur ${palette}`}>
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p className="text-sm leading-5">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-auto rounded p-0.5 opacity-70 hover:opacity-100"
                aria-label="Fermer la notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast doit être utilisé dans ToastProvider');
  }
  return context;
}
