import React, { useState } from 'react';
import ContractsList from '../components/ContractsList';
import ContractEditor from '../components/ContractEditor';
import { useContracts } from '../hooks/useContracts';
import { Contract, ContractTemplate } from '../types';

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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Called by ContractEditor with the full mutated contracts array.
  // We extract only the new/changed contract and forward it to Firestore.
  const handleSetContracts = (newContracts: Contract[]) => {
    if (editingId) {
      // Edit path: find the updated version of the contract being edited
      const updated = newContracts.find((c) => c.id === editingId);
      if (updated) {
        updateContract(editingId, updated);
      }
    } else {
      // New contract path: find the contract whose id doesn't exist yet
      // Use newContracts itself as the source of truth — the last element
      // is always the newly added one because ContractEditor appends it.
      const existingIds = new Set(contracts.map((c) => c.id));
      const added = newContracts.find((c) => !existingIds.has(c.id));
      if (added) {
        addContract(added);
      }
    }
  };

  const handleSetTemplates = (newTemplates: ContractTemplate[]) => {
    const existingIds = new Set(templates.map((t) => t.id));
    const added = newTemplates.find((t) => !existingIds.has(t.id));
    if (added) {
      addTemplate(added);
    }
  };

  if (showEditor) {
    return (
      <ContractEditor
        contractId={editingId}
        onClose={() => {
          setShowEditor(false);
          setEditingId(null);
        }}
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
      onEdit={(id: string) => {
        setEditingId(id);
        setShowEditor(true);
      }}
      onCreate={() => {
        setEditingId(null);
        setShowEditor(true);
      }}
    />
  );
}
