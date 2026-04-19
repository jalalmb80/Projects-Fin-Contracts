import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, orderBy,
  doc, setDoc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '../../../core/firebase';
import { Contract, Client, ContractTemplate, Project, WorkflowEvent } from '../types';
import { usePlatform } from '../../../core/context/PlatformContext';
import { useSharedClients } from '../../../core/hooks/useSharedClients';

export function useContracts() {
  const { user } = usePlatform();

  const {
    asCmsClients,
    addClient: addSharedClient,
    updateClient: updateSharedClient,
    deleteClient: deleteSharedClient,
  } = useSharedClients();

  const [contracts,  setContracts]  = useState<Contract[]>([]);
  const [templates,  setTemplates]  = useState<ContractTemplate[]>([]);
  const [projects,   setProjects]   = useState<Project[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const unsubs = [
      onSnapshot(
        query(collection(db, 'cms_contracts'), orderBy('start_date', 'desc')),
        snap => {
          setContracts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Contract)));
          setLoading(false);
        },
        error => { console.error('[useContracts] contracts error:', error.code); setLoading(false); }
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

  const addContract = async (c: Contract) =>
    setDoc(doc(db, 'cms_contracts', c.id), c);

  const updateContract = async (id: string, data: Partial<Contract>) =>
    updateDoc(doc(db, 'cms_contracts', id), data as any);

  const deleteContract = async (id: string) =>
    deleteDoc(doc(db, 'cms_contracts', id));

  /**
   * addWorkflowEvent — atomic single updateDoc.
   *
   * Prepends `event` to workflow_events (newest first).
   * If `newStatus` is supplied, also updates contract.status in the same write.
   * Never reads from Firestore — uses the in-memory contracts array.
   */
  const addWorkflowEvent = async (
    contractId: string,
    event: WorkflowEvent,
    newStatus?: string,
  ) => {
    const contract = contracts.find(c => c.id === contractId);
    const existing = contract?.workflow_events ?? [];
    const patch: Partial<Contract> = {
      workflow_events: [event, ...existing],
    };
    if (newStatus !== undefined) patch.status = newStatus;
    await updateDoc(doc(db, 'cms_contracts', contractId), patch as any);
  };

  // ── Client CRUD (proxied through shared_clients) ──────────────────────────
  const addClient = async (c: Omit<Client, 'id'>) => {
    await addSharedClient({
      name_ar:              c.name_ar,
      type:                 'CUSTOMER',
      entity_type:          c.entity_type as any,
      license_authority:    c.license_authority,
      license_no:           c.license_no,
      representative_name:  c.representative_name,
      representative_title: c.representative_title,
      national_id:          c.national_id,
      address:              c.address,
      city:                 c.city,
      postal_code:          c.postal_code,
      phone:                c.phone,
      email:                c.email,
      modules:              ['cms'],
      status:               'active',
    });
  };

  const updateClient = async (id: string, data: Partial<Client>) =>
    updateSharedClient(id, data as any);

  const deleteClient = async (id: string) =>
    deleteSharedClient(id);

  // ── Template CRUD ─────────────────────────────────────────────────────────
  const addTemplate = async (t: ContractTemplate) =>
    setDoc(doc(db, 'cms_templates', t.id), t);

  const updateTemplate = async (id: string, data: Partial<ContractTemplate>) =>
    updateDoc(doc(db, 'cms_templates', id), data as any);

  const deleteTemplate = async (id: string) =>
    deleteDoc(doc(db, 'cms_templates', id));

  // ── Project CRUD ──────────────────────────────────────────────────────────
  const addProject = async (p: Omit<Project, 'id'>) => {
    const id = crypto.randomUUID();
    await setDoc(doc(db, 'cms_projects', id), { ...p, id });
  };

  const updateProject = async (id: string, data: Partial<Project>) =>
    updateDoc(doc(db, 'cms_projects', id), data as any);

  const deleteProject = async (id: string) =>
    deleteDoc(doc(db, 'cms_projects', id));

  return {
    contracts,
    clients: asCmsClients as unknown as Client[],
    templates,
    projects,
    loading,
    addContract, updateContract, deleteContract,
    addWorkflowEvent,
    addClient, updateClient, deleteClient,
    addTemplate, updateTemplate, deleteTemplate,
    addProject, updateProject, deleteProject,
  };
}
