import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'atelier-appname';
const DEFAULT_NAME = 'Atelier Informatique';

export function useAppName() {
  const [appName, setAppName] = useState<string>(DEFAULT_NAME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setAppName(saved);
      }
    } catch (_) {
      // localStorage not available
    }
    setMounted(true);
  }, []);

  const updateAppName = useCallback((newName: string) => {
    if (newName.trim()) {
      setAppName(newName.trim());
      try {
        localStorage.setItem(STORAGE_KEY, newName.trim());
      } catch (_) {
        // localStorage not available
      }
    }
  }, []);

  return { appName, updateAppName, mounted };
}

export function getAppName(): string {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_NAME;
    }
  } catch (_) {
    // localStorage not available
  }
  return DEFAULT_NAME;
}
