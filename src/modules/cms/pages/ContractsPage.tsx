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

  // BUG-7 FIX: auto-open editor when navigated with ?new=1 (e.g. from dashboard)
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditingId(null);
      setShowEditor(true);
      // Remove the param so back-navigation doesn't re-open
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const handleSetContracts = (newContracts: Contract[]) => {
    if (editingId) {
      const updated = newContracts.find((c) => c.id === editingId);
      if (updated) updateContract(editingId, updated);
    } else {
      const existingIds = new Set(contracts.map((c) => c.id));
      const added = newContracts.find((c) => !existingIds.has(c.id));
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
