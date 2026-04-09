import React, { useState } from 'react';
import TemplatesList from '../components/TemplatesList';
import TemplateEditor from '../components/TemplateEditor';
import { useContracts } from '../hooks/useContracts';
import { ContractTemplate } from '../types';

export default function TemplatesPage() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useContracts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Called by TemplateEditor.handleSave and TemplatesList (duplicate/delete)
  const handleSetTemplates = async (newTemplates: ContractTemplate[]) => {
    if (newTemplates.length > templates.length) {
      // New template added (duplicate action from TemplatesList)
      const added = newTemplates[newTemplates.length - 1];
      await addTemplate(added);
    } else if (newTemplates.length < templates.length) {
      // Template deleted
      const deleted = templates.find(t => !newTemplates.find(n => n.id === t.id));
      if (deleted) await deleteTemplate(deleted.id);
    } else {
      // Template updated (edit save from TemplateEditor)
      const changed = newTemplates.find(n => {
        const original = templates.find(t => t.id === n.id);
        return original && JSON.stringify(original) !== JSON.stringify(n);
      });
      if (changed) await updateTemplate(changed.id, changed);
    }
  };

  if (showEditor) {
    return (
      <div className="p-8">
        <TemplateEditor
          templateId={editingId}
          onClose={() => { setShowEditor(false); setEditingId(null); }}
          templates={templates}
          setTemplates={handleSetTemplates}
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      <TemplatesList
        templates={templates}
        setTemplates={handleSetTemplates}
        setView={() => setShowEditor(true)}
        setEditingTemplateId={setEditingId}
      />
    </div>
  );
}
