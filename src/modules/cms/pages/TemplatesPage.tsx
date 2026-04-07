import React, { useState } from 'react';
import TemplatesList from '../components/TemplatesList';
import TemplateEditor from '../components/TemplateEditor';
import { useContracts } from '../hooks/useContracts';

export default function TemplatesPage() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useContracts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleSetTemplates = async (newTemplates: any) => {
    // This is a bit hacky since TemplatesList assumes it can just set the array.
    // We'll intercept the duplicate and delete actions.
    if (newTemplates.length > templates.length) {
      // Duplicate
      const added = newTemplates[newTemplates.length - 1];
      await addTemplate(added);
    } else if (newTemplates.length < templates.length) {
      // Delete
      const deleted = templates.find(t => !newTemplates.find((n: any) => n.id === t.id));
      if (deleted) {
        await deleteTemplate(deleted.id);
      }
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
