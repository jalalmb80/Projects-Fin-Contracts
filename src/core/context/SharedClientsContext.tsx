// =============================================================================
// src/core/context/SharedClientsContext.tsx
//
// Singleton provider for the shared_clients Firestore collection.
//
// PROBLEM SOLVED:
//   useSharedClients() was a stateful hook — every call site created its own
//   onSnapshot listener against shared_clients. With Finance (AppContext) and
//   CMS (useContracts) both calling it, there were always ≥2 concurrent
//   listeners on the same collection, doubling Firestore read charges and
//   causing brief data-jitter when they resolved at different times.
//
// SOLUTION:
//   One SharedClientsProvider at App.tsx level owns the single listener.
//   useSharedClients() (hook) is now a thin wrapper around this context —
//   all existing call sites keep their import path with zero code changes.
// =============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, orderBy,
  doc, setDoc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { usePlatform } from './PlatformContext';
import {
  SharedClient,
  SharedClientModule,
  toFinanceCounterparty,
  toCmsClient,
} from '../types/sharedClient';

type FinanceCounterparty = ReturnType<typeof toFinanceCounterparty>;
type CmsClient           = ReturnType<typeof toCmsClient>;

interface SharedClientsContextValue {
  clients:                SharedClient[];
  loading:                boolean;
  financeClients:         SharedClient[];
  cmsClients:             SharedClient[];
  asFinanceCounterparties: FinanceCounterparty[];
  asCmsClients:           CmsClient[];
  addClient:       (data: Omit<SharedClient, 'id' | 'created_at' | 'updated_at'>) => Promise<string>;
  updateClient:    (id: string, data: Partial<SharedClient>) => Promise<void>;
  deleteClient:    (id: string) => Promise<void>;
  registerModule:  (clientId: string, module: SharedClientModule) => Promise<void>;
}

const SharedClientsContext = createContext<SharedClientsContextValue | null>(null);

export function SharedClientsProvider({ children }: { children: React.ReactNode }) {
  const { user } = usePlatform();
  const [clients,  setClients]  = useState<SharedClient[]>([]);
  const [loading,  setLoading]  = useState(true);

  // Single onSnapshot — shared by every module in the app.
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const unsub = onSnapshot(
      query(collection(db, 'shared_clients'), orderBy('name_ar')),
      snap => {
        setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as SharedClient)));
        setLoading(false);
      },
      err => {
        console.error('[SharedClients] snapshot error:', err.code);
        setLoading(false);
      }
    );

    return unsub;
  }, [user?.uid]);

  const now = () => new Date().toISOString();

  const addClient = async (
    data: Omit<SharedClient, 'id' | 'created_at' | 'updated_at'>
  ): Promise<string> => {
    const id = crypto.randomUUID();
    const record: SharedClient = { ...data, id, created_at: now(), updated_at: now() };
    await setDoc(doc(db, 'shared_clients', id), record);
    return id;
  };

  const updateClient = async (id: string, data: Partial<SharedClient>): Promise<void> => {
    await updateDoc(doc(db, 'shared_clients', id), { ...data, updated_at: now() } as any);
  };

  const deleteClient = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'shared_clients', id));
  };

  const registerModule = async (clientId: string, module: SharedClientModule): Promise<void> => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const modules = Array.from(new Set([...(client.modules ?? []), module]));
    await updateClient(clientId, { modules });
  };

  const financeClients = clients.filter(
    c => c.type === 'CUSTOMER' || c.type === 'BOTH' || c.type === 'INTERCOMPANY'
  );
  const cmsClients = clients.filter(c => (c.status ?? 'active') === 'active');

  const value: SharedClientsContextValue = {
    clients, loading,
    financeClients,
    cmsClients,
    asFinanceCounterparties: financeClients.map(toFinanceCounterparty),
    asCmsClients:            cmsClients.map(toCmsClient),
    addClient, updateClient, deleteClient, registerModule,
  };

  return (
    <SharedClientsContext.Provider value={value}>
      {children}
    </SharedClientsContext.Provider>
  );
}

export function useSharedClientsContext(): SharedClientsContextValue {
  const ctx = useContext(SharedClientsContext);
  if (!ctx) throw new Error('useSharedClientsContext must be used within SharedClientsProvider');
  return ctx;
}
