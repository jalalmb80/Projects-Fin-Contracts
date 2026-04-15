import React, { useState, useEffect } from 'react';
import ContractsList from '../components/ContractsList';
import ContractEditor from '../components/ContractEditor';
import { useContracts } from '../hooks/useContracts';
import { Contract, ContractTemplate } from '../types';
import { useSearchParams } from 'react-router-dom';

export default function ContractsPage() {
  const {
    contracts,
    clients,
    templates,
    projects,
    addContract,
    updateContract,
    addTemplate,
  } = useContracts();

  const [searchParams, setSearchParams] = useSearchParams();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Auto-open editor when navigated with ?new=1 (e.g. from Dashboard)
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditingId(null);
      setShowEditor(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  // ContractEditor calls setContracts with the full mutated array.
  // We extract only the new/changed contract and forward it to Firestore.
  const handleSetContracts = (newContracts: Contract[]) => {
    if (editingId) {
      // Edit path: find the contract being edited and update it
      const updated = newContracts.find((c) => c.id === editingId);
      if (updated) updateContract(editingId, updated);
    } else {
      // New contract path: find the id that does not yet exist in Firestore
      const existingIds = new Set(contracts.map((c) => c.id));
      const added = newContracts.find((c) => !existingIds.has(c.id));
      // addContract now preserves the id on the contract object
      if (added) addContract(added);
    }
  };

  const handleSetTemplates = (newTemplates: ContractTemplate[]) => {
    const existingIds = new Set(templates.map((t) => t.id));
    const added = newTemplates.find((t) => !existingIds.has(t.id));
    if (added) addTemplate(added);
  };

  if (showEditor) {
    return (
      <ContractEditor
        contractId={editingId}
        onClose={() => { setShowEditor(false); setEditingId(null); }}
        contracts={contracts}
        setContracts={handleSetContracts}
        projects={projects}
        clients={clients}
        templates={templates}
        setTemplates={handleSetTemplates}
      />
    );
  }

  return (
    <ContractsList
      contracts={contracts}
      clients={clients}
      onEdit={(id: string) => { setEditingId(id); setShowEditor(true); }}
      onCreate={() => { setEditingId(null); setShowEditor(true); }}
    />
  );
}
