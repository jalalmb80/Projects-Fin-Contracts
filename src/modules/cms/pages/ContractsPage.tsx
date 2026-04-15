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

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditingId(null);
      setShowEditor(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  if (showEditor) {
    return (
      <ContractEditor
        contractId={editingId}
        onClose={() => { setShowEditor(false); setEditingId(null); }}
        contracts={contracts}
        onSaveNew={addContract}
        onSaveEdit={updateContract}
        projects={projects}
        clients={clients}
        templates={templates}
        onSaveTemplate={addTemplate}
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
