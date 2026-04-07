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
    addTemplate 
  } = useContracts();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleSetContracts = (newContracts: Contract[]) => {
    if (editingId) {
      const updated = newContracts.find(c => c.id === editingId);
      if (updated) {
        updateContract(editingId, updated);
      }
    } else {
      const added = newContracts.find(c => !contracts.some(existing => existing.id === c.id));
      if (added) {
        addContract(added);
      }
    }
  };

  const handleSetTemplates = (newTemplates: ContractTemplate[]) => {
    const added = newTemplates.find(t => !templates.some(existing => existing.id === t.id));
    if (added) {
      addTemplate(added);
    }
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
