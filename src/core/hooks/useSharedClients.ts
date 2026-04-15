// =============================================================================
// src/core/hooks/useSharedClients.ts
//
// Platform-wide customer / vendor hook.
// Import from here in Finance, CMS, and any future module.
// =============================================================================

import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { usePlatform } from '../context/PlatformContext';
import {
  SharedClient,
  SharedClientModule,
  toFinanceCounterparty,
  toCmsClient,
} from '../types/sharedClient';

export function useSharedClients() {
  const { user } = usePlatform();
  const [clients, setClients] = useState<SharedClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const unsub = onSnapshot(
      query(collection(db, 'shared_clients'), orderBy('name_ar')),
      snap => {
        setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as SharedClient)));
        setLoading(false);
      },
      err => {
        console.error('[useSharedClients] snapshot error:', err.code);
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  const now = () => new Date().toISOString();

  const addClient = async (
    data: Omit<SharedClient, 'id' | 'created_at' | 'updated_at'>
  ): Promise<string> => {
    const id = crypto.randomUUID();
    const record: SharedClient = { ...data, id, created_at: now(), updated_at: now() };
    await setDoc(doc(db, 'shared_clients', id), record);
    return id;
  };

  const updateClient = async (
    id: string,
    data: Partial<SharedClient>
  ): Promise<void> => {
    await updateDoc(
      doc(db, 'shared_clients', id),
      { ...data, updated_at: now() } as any
    );
  };

  const deleteClient = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'shared_clients', id));
  };

  const registerModule = async (
    clientId: string,
    module: SharedClientModule
  ): Promise<void> => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const modules = Array.from(new Set([...(client.modules ?? []), module]));
    await updateClient(clientId, { modules });
  };

  /** Finance: CUSTOMER | BOTH | INTERCOMPANY */
  const financeClients = clients.filter(
    c => c.type === 'CUSTOMER' || c.type === 'BOTH' || c.type === 'INTERCOMPANY'
  );

  /** CMS: all active records */
  const cmsClients = clients.filter(c => (c.status ?? 'active') === 'active');

  /** Finance adapter — same shape as old Counterparty[] */
  const asFinanceCounterparties = financeClients.map(toFinanceCounterparty);

  /** CMS adapter — same shape as old Client[] */
  const asCmsClients = cmsClients.map(toCmsClient);

  return {
    clients,
    financeClients,
    cmsClients,
    asFinanceCounterparties,
    asCmsClients,
    loading,
    addClient,
    updateClient,
    deleteClient,
    registerModule,
  };
}
