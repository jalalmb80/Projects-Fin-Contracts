import React, { useState } from 'react';
import { ContractTemplate } from '../types';
import { Plus, Search, FileText, Edit, Copy, Trash2, CheckCircle2 } from 'lucide-react';
import { useLang, t } from '../context/LanguageContext';

export default function TemplatesList({ templates, setTemplates, setView, setEditingTemplateId }: any) {
  const { lang } = useLang();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTemplates = templates.filter((t: ContractTemplate) =>
    t.name_ar.includes(searchTerm) || t.category.includes(searchTerm)
  );

  const handleCreate = () => {
    setEditingTemplateId(null);
    setView('template_editor');
  };

  const handleEdit = (id: string) => {
    setEditingTemplateId(id);
    setView('template_editor');
  };

  const handleDuplicate = (template: ContractTemplate) => {
    const newTemplate = {
      ...template,
      id: Date.now().toString(),
      name_ar: `${template.name_ar} (نسخة)`,
      is_default: false
    };
    setTemplates([...templates, newTemplate]);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القالب؟')) {
      setTemplates(templates.filter((t: ContractTemplate) => t.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('قوالب العقود', 'Contract Templates', lang)}</h1>
          <p className="text-slate-500 mt-1">{t('إدارة القوالب الجاهزة لإنشاء العقود', 'Manage ready-made templates for contract creation', lang)}</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          <span>{t('قالب جديد', 'New Template', lang)}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              dir="rtl"
              placeholder={t('البحث في القوالب...', 'Search templates...', lang)}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">{t('اسم القالب', 'Template Name', lang)}</th>
                <th className="px-6 py-4 font-medium">{t('التصنيف', 'Category', lang)}</th>
                <th className="px-6 py-4 font-medium">{t('نوع العقد', 'Contract Type', lang)}</th>
                <th className="px-6 py-4 font-medium">{t('عدد البنود', 'Articles Count', lang)}</th>
                <th className="px-6 py-4 font-medium">{t('افتراضي؟', 'Default?', lang)}</th>
                <th className="px-6 py-4 font-medium w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTemplates.map((template: ContractTemplate) => (
                <tr key={template.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{template.name_ar}</p>
                        {template.description && <p className="text-xs text-slate-500 mt-1">{template.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {template.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{template.default_type}</td>
                  <td className="px-6 py-4 text-slate-600">{template.default_articles.length} بنود</td>
                  <td className="px-6 py-4">
                    {template.is_default && <CheckCircle2 size={20} className="text-emerald-500" />}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button onClick={() => handleEdit(template.id)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title={t('تعديل', 'Edit', lang)}>
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDuplicate(template)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title={t('نسخ', 'Duplicate', lang)}>
                        <Copy size={18} />
                      </button>
                      <button onClick={() => handleDelete(template.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title={t('حذف', 'Delete', lang)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTemplates.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    {t('لا توجد قوالب تطابق بحثك', 'No templates match your search', lang)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
