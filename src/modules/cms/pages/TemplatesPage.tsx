import React, { useState } from 'react';
import TemplatesList from '../components/TemplatesList';
import TemplateEditor from '../components/TemplateEditor';
import { useCMSContext } from '../context/CMSContext';
import { ContractTemplate } from '../types';

export default function TemplatesPage() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useCMSContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleSetTemplates = async (newTemplates: ContractTemplate[]) => {
    if (showEditor) {
      if (editingId) {
        const updated = newTemplates.find((n) => n.id === editingId);
        if (updated) await updateTemplate(editingId, updated);
      } else {
        const existingIds = new Set(templates.map((t) => t.id));
        const added = newTemplates.find((n) => !existingIds.has(n.id));
        if (added) await addTemplate(added);
      }
    } else {
      const existingIds = new Set(templates.map((t) => t.id));
      const newIds = new Set(newTemplates.map((n) => n.id));
      const added = newTemplates.find((n) => !existingIds.has(n.id));
      if (added) { await addTemplate(added); return; }
      const deleted = templates.find((t) => !newIds.has(t.id));
      if (deleted) await deleteTemplate(deleted.id);
    }
  };

  if (showEditor) {
    return (
      <div className="h-full flex flex-col">
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
