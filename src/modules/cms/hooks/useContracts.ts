import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, orderBy,
  doc, setDoc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { db } from '../../../core/firebase';
import { Contract, Client, ContractTemplate } from '../types';

export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const now = () => new Date().toISOString();
  const uid = () => crypto.randomUUID();

  useEffect(() => {
    const unsubs = [
      onSnapshot(query(collection(db, 'cms_contracts'), orderBy('start_date', 'desc')),
        snap => { setContracts(snap.docs.map(d => d.data() as Contract)); setLoading(false); }),
      onSnapshot(query(collection(db, 'cms_clients'), orderBy('name_ar')),
        snap => setClients(snap.docs.map(d => d.data() as Client))),
      onSnapshot(query(collection(db, 'cms_templates'), orderBy('name_ar')),
        snap => setTemplates(snap.docs.map(d => d.data() as ContractTemplate))),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const addContract = async (c: Omit<Contract, 'id'>) => {
    const id = uid();
    await setDoc(doc(db, 'cms_contracts', id), { ...c, id });
  };
  const updateContract = async (id: string, data: Partial<Contract>) =>
    updateDoc(doc(db, 'cms_contracts', id), data);
  const deleteContract = async (id: string) =>
    deleteDoc(doc(db, 'cms_contracts', id));

  const addClient = async (c: Omit<Client, 'id'>) => {
    const id = uid();
    await setDoc(doc(db, 'cms_clients', id), { ...c, id });
  };
  const updateClient = async (id: string, data: Partial<Client>) =>
    updateDoc(doc(db, 'cms_clients', id), data);
  const deleteClient = async (id: string) =>
    deleteDoc(doc(db, 'cms_clients', id));

  const addTemplate = async (t: Omit<ContractTemplate, 'id'>) => {
    const id = uid();
    await setDoc(doc(db, 'cms_templates', id), { ...t, id });
  };
  const updateTemplate = async (id: string, data: Partial<ContractTemplate>) =>
    updateDoc(doc(db, 'cms_templates', id), data);
  const deleteTemplate = async (id: string) =>
    deleteDoc(doc(db, 'cms_templates', id));

  return {
    contracts, clients, templates, loading,
    addContract, updateContract, deleteContract,
    addClient, updateClient, deleteClient,
    addTemplate, updateTemplate, deleteTemplate,
  };
}
