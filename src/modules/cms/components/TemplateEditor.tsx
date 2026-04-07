import React, { useState, useEffect } from 'react';
import { ContractTemplate, Article, PaymentSchedule, Appendix } from '../types';
import { Save, X, FileText, CreditCard, Paperclip, Eye, FileCode2 } from 'lucide-react';
import { useLang, t } from '../context/LanguageContext';
import { ArticlesEditor, PaymentsEditor, AppendicesEditor } from './ContractEditor';

type Tab = 'metadata' | 'articles' | 'payments' | 'appendices' | 'preview';

export default function TemplateEditor({ templateId, onClose, templates, setTemplates }: any) {
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState<Tab>('metadata');
  const [template, setTemplate] = useState<ContractTemplate | null>(null);

  useEffect(() => {
    if (templateId) {
      const existing = templates.find((t: ContractTemplate) => t.id === templateId);
      if (existing) setTemplate(JSON.parse(JSON.stringify(existing)));
    } else {
      setTemplate({
        id: Date.now().toString(),
        name_ar: 'قالب جديد',
        category: 'مخصص',
        default_status: 'مسودة',
        default_type: 'تطوير برمجيات',
        default_articles: [],
        default_payment_schedule: {
          subtotal_sar: 0,
          vat_rate: 15,
          vat_amount: 0,
          total_sar: 0,
          bank_iban: '',
          bank_name: '',
          account_holder: '',
          tasks: [],
          installments: []
        },
        default_appendices: [],
        tags: [],
        is_default: false
      });
    }
  }, [templateId, templates]);

  if (!template) return <div className="p-8">Loading...</div>;

  const handleSave = () => {
    if (templateId) {
      setTemplates(templates.map((t: ContractTemplate) => t.id === template.id ? template : t));
    } else {
      setTemplates([...templates, template]);
    }
    onClose();
  };

  const tabs = [
    { id: 'metadata', label_ar: 'معلومات القالب', label_en: 'Template Info', icon: FileCode2 },
    { id: 'articles', label_ar: 'البنود الافتراضية', label_en: 'Default Articles', icon: FileText },
    { id: 'payments', label_ar: 'المدفوعات الافتراضية', label_en: 'Default Payments', icon: CreditCard },
    { id: 'appendices', label_ar: 'الملاحق الافتراضية', label_en: 'Default Appendices', icon: Paperclip },
  ];

  // Create a mock contract object to pass to the editors
  const mockContract = {
    ...template,
    articles: template.default_articles,
    payment_schedule: template.default_payment_schedule,
    appendices: template.default_appendices,
  };

  const setMockContract = (newContract: any) => {
    setTemplate({
      ...template,
      default_articles: newContract.articles,
      default_payment_schedule: newContract.payment_schedule,
      default_appendices: newContract.appendices,
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 no-print">
        <div className="flex items-center space-x-4 space-x-reverse">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <X size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{template.name_ar}</h1>
            <p className="text-sm text-slate-500">تعديل القالب</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button onClick={handleSave} className="flex items-center space-x-2 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            <Save size={18} />
            <span>{t('حفظ القالب', 'Save Template', lang)}</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-white border-l border-slate-200 flex flex-col shrink-0 no-print">
          <div className="p-4 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={18} className={activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400'} />
                <span>{t(tab.label_ar, tab.label_en, lang)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            {activeTab === 'metadata' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 mb-6">{t('معلومات القالب', 'Template Information', lang)}</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">{t('اسم القالب', 'Template Name', lang)}</label>
                      <input 
                        type="text" 
                        dir="rtl"
                        value={template.name_ar} 
                        onChange={e => setTemplate({...template, name_ar: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">{t('التصنيف', 'Category', lang)}</label>
                      <select 
                        value={template.category}
                        onChange={e => setTemplate({...template, category: e.target.value as any})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="تطوير برمجيات">تطوير برمجيات</option>
                        <option value="اشتراك/SaaS">اشتراك/SaaS</option>
                        <option value="إنتاج محتوى">إنتاج محتوى</option>
                        <option value="مختلط">مختلط</option>
                        <option value="مخصص">مخصص</option>
                      </select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-sm font-medium text-slate-700">{t('وصف القالب', 'Template Description', lang)}</label>
                      <textarea 
                        dir="rtl"
                        value={template.description || ''} 
                        onChange={e => setTemplate({...template, description: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none h-24"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'articles' && <ArticlesEditor contract={mockContract} setContract={setMockContract} lang={lang} />}
            {activeTab === 'payments' && <PaymentsEditor contract={mockContract} setContract={setMockContract} lang={lang} />}
            {activeTab === 'appendices' && <AppendicesEditor contract={mockContract} setContract={setMockContract} lang={lang} />}
          </div>
        </div>
      </div>
    </div>
  );
}
