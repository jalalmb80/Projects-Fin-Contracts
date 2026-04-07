import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface SharedCounterparty {
  id: string;
  name: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  taxId?: string;
  contactPerson?: string;
}

interface SharedProject {
  id: string;
  name: string;
  clientId: string;
  contractValue: number;
  status: string;
  startDate: string;
  description?: string;
}

interface PlatformContextValue {
  user: User | null;
  loadingAuth: boolean;
  counterparties: SharedCounterparty[];
  projects: SharedProject[];
  activeModule: string;
  setActiveModule: (id: string) => void;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [counterparties, setCounterparties] = useState<SharedCounterparty[]>([]);
  const [projects, setProjects] = useState<SharedProject[]>([]);
  const [activeModule, setActiveModule] = useState('finance');

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setLoadingAuth(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const u1 = onSnapshot(collection(db, 'counterparties'), snap =>
      setCounterparties(snap.docs.map(d => ({ id: d.id, ...d.data() } as SharedCounterparty)))
    );
    const u2 = onSnapshot(collection(db, 'projects'), snap =>
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as SharedProject)))
    );
    return () => { u1(); u2(); };
  }, [user]);

  return (
    <PlatformContext.Provider value={{ user, loadingAuth, counterparties, projects, activeModule, setActiveModule }}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used inside PlatformProvider');
  return ctx;
}
