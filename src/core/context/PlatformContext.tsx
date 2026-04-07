import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface PlatformContextValue {
  user: User | null;
  loadingAuth: boolean;
  activeModule: string;
  setActiveModule: (id: string) => void;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeModule, setActiveModule] = useState('finance');

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setLoadingAuth(false);
    });
  }, []);

  return (
    <PlatformContext.Provider value={{ user, loadingAuth, activeModule, setActiveModule }}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used inside PlatformProvider');
  return ctx;
}
