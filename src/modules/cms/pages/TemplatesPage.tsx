import React, { useState } from 'react';
import TemplatesList from '../components/TemplatesList';
import TemplateEditor from '../components/TemplateEditor';
import { useContracts } from '../hooks/useContracts';
import { ContractTemplate } from '../types';

export default function TemplatesPage() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useContracts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  /**
   * Called by TemplateEditor.handleSave (passes full array) and
   * TemplatesList (duplicate / delete actions).
   *
   * We resolve intent via showEditor + editingId (same pattern as ContractsPage):
   *  - showEditor + editingId  -> edit save   -> updateTemplate
   *  - showEditor + !editingId -> new save    -> addTemplate
   *  - !showEditor             -> list action -> Set-diff to detect add or delete
   */
  const handleSetTemplates = async (newTemplates: ContractTemplate[]) => {
    if (showEditor) {
      if (editingId) {
        // Edit save: find the changed template by id
        const updated = newTemplates.find((n) => n.id === editingId);
        if (updated) await updateTemplate(editingId, updated);
      } else {
        // New template save: find the id not yet in Firestore
        const existingIds = new Set(templates.map((t) => t.id));
        const added = newTemplates.find((n) => !existingIds.has(n.id));
        if (added) await addTemplate(added);
      }
    } else {
      // List action: duplicate (add) or delete
      const existingIds = new Set(templates.map((t) => t.id));
      const newIds = new Set(newTemplates.map((n) => n.id));

      const added = newTemplates.find((n) => !existingIds.has(n.id));
      if (added) {
        await addTemplate(added);
        return;
      }

      const deleted = templates.find((t) => !newIds.has(t.id));
      if (deleted) await deleteTemplate(deleted.id);
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
