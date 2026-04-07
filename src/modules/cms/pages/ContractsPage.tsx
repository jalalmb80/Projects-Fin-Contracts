import React, { useState } from 'react';
import ContractsList from '../components/ContractsList';
import ContractEditor from '../components/ContractEditor';
import { useContracts } from '../hooks/useContracts';

export default function ContractsPage() {
  const { contracts, clients, templates, addContract, updateContract, setTemplates } = useContracts() as any;
  const { projects } = useContracts() as any;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  if (showEditor) {
    return (
      <ContractEditor
        contractId={editingId}
        onClose={() => { setShowEditor(false); setEditingId(null); }}
        contracts={contracts}
        setContracts={() => {}}
        projects={projects as any}
        clients={clients}
        templates={templates}
        setTemplates={() => {}}
      />
    );
  }
  return (
    <ContractsList
      contracts={contracts}
      clients={clients}
      onEdit={(id) => { setEditingId(id); setShowEditor(true); }}
      onCreate={() => { setEditingId(null); setShowEditor(true); }}
    />
  );
}
