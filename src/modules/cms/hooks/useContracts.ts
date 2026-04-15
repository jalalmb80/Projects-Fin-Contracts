import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, orderBy,
  doc, setDoc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { db } from '../../../core/firebase';
import { Contract, Client, ContractTemplate, Project } from '../types';
import { usePlatform } from '../../../core/context/PlatformContext';

export function useContracts() {
  const { user } = usePlatform();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubs = [
      onSnapshot(
        query(collection(db, 'cms_contracts'), orderBy('start_date', 'desc')),
        snap => { setContracts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Contract))); setLoading(false); },
        error => { console.error('[useContracts] contracts error:', error.code); setLoading(false); }
      ),
      onSnapshot(
        query(collection(db, 'cms_clients'), orderBy('name_ar')),
        snap => setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client))),
        error => { console.error('[useContracts] clients error:', error.code); }
      ),
      onSnapshot(
        query(collection(db, 'cms_templates'), orderBy('name_ar')),
        snap => setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() } as ContractTemplate))),
        error => { console.error('[useContracts] templates error:', error.code); }
      ),
      onSnapshot(
        query(collection(db, 'cms_projects'), orderBy('name_ar')),
        snap => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project))),
        error => { console.error('[useContracts] projects error:', error.code); }
      ),
    ];
    return () => unsubs.forEach(u => u());
  }, [user]);

  // FIX: use the id already on the contract object so local state and Firestore stay in sync.
  // Previously a new uid() was generated here, causing the locally-tracked id to diverge
  // from the Firestore document id — breaking subsequent edit opens.
  const addContract = async (c: Contract) =>
    setDoc(doc(db, 'cms_contracts', c.id), c);

  const updateContract = async (id: string, data: Partial<Contract>) =>
    updateDoc(doc(db, 'cms_contracts', id), data as any);

  const deleteContract = async (id: string) =>
    deleteDoc(doc(db, 'cms_contracts', id));

  const addClient = async (c: Omit<Client, 'id'>) => {
    const id = crypto.randomUUID();
    await setDoc(doc(db, 'cms_clients', id), { ...c, id });
  };
  const updateClient = async (id: string, data: Partial<Client>) =>
    updateDoc(doc(db, 'cms_clients', id), data as any);
  const deleteClient = async (id: string) =>
    deleteDoc(doc(db, 'cms_clients', id));

  const addTemplate = async (t: ContractTemplate) =>
    setDoc(doc(db, 'cms_templates', t.id), t);

  const updateTemplate = async (id: string, data: Partial<ContractTemplate>) =>
    updateDoc(doc(db, 'cms_templates', id), data as any);
  const deleteTemplate = async (id: string) =>
    deleteDoc(doc(db, 'cms_templates', id));

  const addProject = async (p: Omit<Project, 'id'>) => {
    const id = crypto.randomUUID();
    await setDoc(doc(db, 'cms_projects', id), { ...p, id });
  };
  const updateProject = async (id: string, data: Partial<Project>) =>
    updateDoc(doc(db, 'cms_projects', id), data as any);
  const deleteProject = async (id: string) =>
    deleteDoc(doc(db, 'cms_projects', id));

  return {
    contracts, clients, templates, projects, loading,
    addContract, updateContract, deleteContract,
    addClient, updateClient, deleteClient,
    addTemplate, updateTemplate, deleteTemplate,
    addProject, updateProject, deleteProject,
  };
}
