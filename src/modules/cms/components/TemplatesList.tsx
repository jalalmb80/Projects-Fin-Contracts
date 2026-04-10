import React, { useState } from 'react';
import { ContractTemplate } from '../types';
import { Plus, Search, FileText, Edit, Copy, Trash2, CheckCircle2 } from 'lucide-react';
import { useLang, t } from '../context/LanguageContext';

export default function TemplatesList({ templates, setTemplates, setView, setEditingTemplateId }: any) {
  const { lang } = useLang();
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredTemplates = templates.filter((tmpl: ContractTemplate) =>
    tmpl.name_ar.includes(searchTerm) || tmpl.category.includes(searchTerm)
  );

  const handleCreate = () => { setEditingTemplateId(null); setView('template_editor'); };
  const handleEdit = (id: string) => { setEditingTemplateId(id); setView('template_editor'); };

  const handleDuplicate = (template: ContractTemplate) => {
    setTemplates([...templates, { ...template, id: Date.now().toString(), name_ar: `${template.name_ar} (\u0646\u0633\u062e\u0629)`, is_default: false }]);
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return; }
    setConfirmDeleteId(null);
    setTemplates(templates.filter((tmpl: ContractTemplate) => tmpl.id !== id));
  };

  const confirmTarget = confirmDeleteId ? templates.find((tmpl: ContractTemplate) => tmpl.id === confirmDeleteId) : null;

  return (
    <div className="space-y-6 p-6">
      {confirmDeleteId && (
        <div className="flex items-center gap-4 bg-red-50 border border-red-200 rounded-lg px-5 py-4 text-sm text-red-800">
          <span className="flex-1">{t('\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u0627\u0644\u0642\u0627\u0644\u0628','Delete template',lang)} <strong>{confirmTarget?.name_ar}</strong>{t('\u061f \u0644\u0627 \u064a\u0645\u0643\u0646 \u0627\u0644\u062a\u0631\u0627\u062c\u0639.','? This cannot be undone.',lang)}</span>
          <button onClick={() => handleDelete(confirmDeleteId)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg font-medium">{t('\u062d\u0630\u0641','Delete',lang)}</button>
          <button onClick={() => setConfirmDeleteId(null)} className="text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg font-medium">{t('\u0625\u0644\u063a\u0627\u0621','Cancel',lang)}</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('\u0642\u0648\u0627\u0644\u0628 \u0627\u0644\u0639\u0642\u0648\u062f','Contract Templates',lang)}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0642\u0648\u0627\u0644\u0628 \u0627\u0644\u062c\u0627\u0647\u0632\u0629 \u0644\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0639\u0642\u0648\u062f','Manage ready-made templates for contract creation',lang)}</p>
        </div>
        <button onClick={handleCreate} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
          <Plus className="mr-2 h-4 w-4" />{t('\u0642\u0627\u0644\u0628 \u062c\u062f\u064a\u062f','New Template',lang)}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400"/></div>
            <input type="text" dir="rtl"
              placeholder={t('\u0627\u0644\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0642\u0648\u0627\u0644\u0628...','Search templates...',lang)}
              value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
              className="block w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500"/>
          </div>
        </div>
        {filteredTemplates.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4"/>
            <h3 className="text-sm font-medium text-gray-900">{t('\u0644\u0627 \u062a\u0648\u062c\u062f \u0642\u0648\u0627\u0644\u0628','No templates found',lang)}</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>
                {[t('\u0627\u0633\u0645 \u0627\u0644\u0642\u0627\u0644\u0628','Template Name',lang),t('\u0627\u0644\u062a\u0635\u0646\u064a\u0641','Category',lang),t('\u0646\u0648\u0639 \u0627\u0644\u0639\u0642\u062f','Contract Type',lang),t('\u0639\u062f\u062f \u0627\u0644\u0628\u0646\u0648\u062f','Articles',lang),t('\u0627\u0641\u062a\u0631\u0627\u0636\u064a','Default',lang),''].map((h,i)=>(
                  <th key={i} scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTemplates.map((template: ContractTemplate) => (
                  <tr key={template.id} className={`hover:bg-gray-50 transition-colors ${confirmDeleteId===template.id?'bg-red-50':''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><FileText size={18}/></div>
                        <div><p className="text-sm font-medium text-gray-900">{template.name_ar}</p>{template.description&&<p className="text-xs text-gray-500 mt-0.5">{template.description}</p>}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{template.category}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.default_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.default_articles.length}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{template.is_default&&<CheckCircle2 size={18} className="text-emerald-500"/>}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={()=>handleEdit(template.id)} className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-md" title={t('\u062a\u0639\u062f\u064a\u0644','Edit',lang)}><Edit size={17}/></button>
                        <button onClick={()=>handleDuplicate(template)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md" title={t('\u0646\u0633\u062e','Duplicate',lang)}><Copy size={17}/></button>
                        <button onClick={()=>handleDelete(template.id)} className={`p-1.5 rounded-md transition-colors ${confirmDeleteId===template.id?'text-red-700 bg-red-50':'text-gray-400 hover:text-red-600'}`} title={t('\u062d\u0630\u0641','Delete',lang)}><Trash2 size={17}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
