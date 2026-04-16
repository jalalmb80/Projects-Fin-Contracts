import React, { useState, useEffect } from 'react';
import { Contract, Article, ArticleBlock, ParagraphBlock, TaskRow, Installment, PaymentSchedule, Appendix, Attachment, ContractVersion, ContractTemplate } from '../types';
import { Save, X, Plus, Trash2, Eye, FileText, Users, CreditCard, Paperclip, History, Lock, Unlock, ArrowUp, ArrowDown, Printer, AlignRight, ListOrdered, FileMinus, FileCode2, FileDown, Cloud, CheckCircle, AlertCircle } from 'lucide-react';
import { useLang, t } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { numberToArabicWords } from '../utils/arabicWords';
import { toHijri } from '../utils/hijriDate';
import { exportContractToPdf, generatePdfBlob } from '../utils/exportPdf';
import { initGoogleDrive, requestDriveAccess, isConnected, uploadPdfToDrive } from '../services/googleDrive';
import { platformBus, PLATFORM_EVENTS } from '../../../core/events/platformBus';

type Tab = 'metadata' | 'articles' | 'payments' | 'appendices' | 'attachments' | 'versions' | 'preview';

// NOTE: body_ar values that contain newlines MUST use template literals (backticks).
// Single-quoted strings with literal newlines cause esbuild "Unterminated string literal" errors.
const getDefaultArticles = (): Article[] => [
  { id: 'a1',  order_index: 1,  title_ar: 'التمهيد',                        body_ar: 'يعتبر التمهيد السابق والمقدمة إضافةً إلى الملاحق المرفقة جزءاً لا يتجزأ من هذا العقد ومتممةً ومفسرةً لأحكامه.', article_type: 'تمهيد', is_locked: true,  is_visible: true },
  { id: 'a2',  order_index: 2,  title_ar: 'الموضوع',                        body_ar: '[عنوان العقد] لصالح الطرف الثاني ([اسم الطرف الثاني]) اعتماداً على العرض الفني المعتمد من قبل الطرفين والملحق مع هذا العقد.', article_type: 'موضوع', is_locked: false, is_visible: true },
  { id: 'a3',  order_index: 3,  title_ar: 'مدة التنفيذ',                   body_ar: 'يلتزم الطرف الأول بتنفيذ [عنوان العقد] لصالح الطرف الثاني خلال مدة لا تزيد عن ستة أشهر من تاريخ توقيع العقد من كلا الطرفين وتحويل الدفعة الأولى لحساب الطرف الأول.', article_type: 'مدة التنفيذ', is_locked: false, is_visible: true },
  { id: 'a4',  order_index: 4,  title_ar: 'القيمة والدفعات',               body_ar: 'تبلغ قيمة العقد الإجمالية المبلغ المحدد في جدول الدفعات أدناه شاملةً ضريبة القيمة المضافة.', article_type: 'القيمة والدفعات', is_locked: false, is_visible: true },
  { id: 'a5',  order_index: 5,  title_ar: 'الملكية الفكرية',                body_ar: 'الملكية الفكرية للمشروع بمكوناته المختلفة هي ملك للطرف الثاني ولا يحق للطرف الأول طلب أي حقوق ملكية عن مخرجات المشروع بعد استلام كامل المستحقات المالية.', article_type: 'الملكية الفكرية', is_locked: false, is_visible: true },
  { id: 'a6',  order_index: 6,  title_ar: 'آلية إدارة المشروع والدعم الفني', body_ar: `١. بعد الاتفاق وتوقيع العقد وإيداع الدفعة الأولى، يُعيّن الطرف الثاني مديراً للمشروع ممثلاً له في هذا التعاقد.\n٢. يتم الاجتماع الأولي بين مدير المشروع الممثل للطرف الثاني ومدير المشروع الممثل للطرف الأول للاتفاق على آليات سير المشروع.`, article_type: 'إدارة المشروع', is_locked: false, is_visible: true },
  { id: 'a7',  order_index: 7,  title_ar: 'آلية طلبات التغيير',            body_ar: 'في حالة قيام الطرف الثاني بطلب تعديل على نطاق العمل المتفق عليه، يقوم الطرف الثاني بالاجتماع مع الطرف الأول لشرح المتطلبات الجديدة.', article_type: 'طلبات التغيير', is_locked: false, is_visible: true },
  { id: 'a8',  order_index: 8,  title_ar: 'إنهاء الاتفاقية',               body_ar: `تنتهي هذه الاتفاقية في الحالات التالية:\n١. باكتمال المشروع وتسليمه بشكل نهائي.\n٢. باتفاق الطرفين على إنهاء المشروع قبل تنفيذه.`, article_type: 'إنهاء الاتفاقية', is_locked: false, is_visible: true },
  { id: 'a9',  order_index: 9,  title_ar: 'أحكام عامة',                     body_ar: `١. يلتزم الطرفان بالأحكام والضوابط الشرعية في تنفيذ الأعمال الفنية.\n٢. يُقر الطرفان بأنهما قد اطلعا على كل بنود ومحتوى هذا العقد.`, article_type: 'أحكام عامة', is_locked: true,  is_visible: true },
  { id: 'a10', order_index: 10, title_ar: 'نُسخ الاتفاقية',               body_ar: `حُرّير هذا العقد من عشرة بنود بنسختين أصليتين باللغة العربية، واستلم كل طرف نسخةً للعمل بموجبها، ويُعتبر توقيع الطرفين على هذا العقد إقراراً بصحته.\nوالله ولي التوفيق.`, article_type: 'نسخ الاتفاقية', is_locked: true,  is_visible: true },
];

interface ContractEditorProps {
  contractId: string | null;
  onClose: () => void;
  contracts: Contract[];
  onSaveNew: (c: Contract) => Promise<void>;
  onSaveEdit: (id: string, data: Partial<Contract>) => Promise<void>;
  projects: any[];
  clients: any[];
  templates: ContractTemplate[];
  onSaveTemplate: (t: ContractTemplate) => Promise<void>;
}

export default function ContractEditor({
  contractId, onClose, contracts, onSaveNew, onSaveEdit,
  projects, clients, templates, onSaveTemplate
}: ContractEditorProps) {
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState<Tab>('metadata');
  const [contract, setContract] = useState<Contract | null>(null);
  const [isSelectingTemplate, setIsSelectingTemplate] = useState(!contractId);
  const [saveAsTemplateModal, setSaveAsTemplateModal] = useState(false);
  const [saveAsTemplateName, setSaveAsTemplateName] = useState('');
  const [saveAsTemplateFeedback, setSaveAsTemplateFeedback] = useState<'success' | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (contractId) {
      const existing = contracts.find((c: Contract) => c.id === contractId);
      if (existing) setContract(JSON.parse(JSON.stringify(existing)));
    }
  }, [contractId, contracts]);

  useEffect(() => {
    if (contract && !contract.client_id && clients && clients.length > 0) {
      setContract(prev => prev ? { ...prev, client_id: clients[0].id } : prev);
    }
  }, [clients, contract?.client_id]);

  const handleSelectTemplate = (template: ContractTemplate | null) => {
    const newContract: Contract = {
      id: Date.now().toString(),
      contract_number: `CMS-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      title_ar: template ? template.name_ar : 'عقد جديد',
      type: template ? template.default_type : 'تطوير برمجيات',
      status: template ? template.default_status : 'مسودة',
      client_id: (clients || [])[0]?.id || '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      hijri_date: toHijri(new Date().toISOString().split('T')[0]),
      tags: template?.tags ? [...template.tags] : [],
      articles: template ? JSON.parse(JSON.stringify(template.default_articles)) : getDefaultArticles(),
      payment_schedule: template?.default_payment_schedule
        ? JSON.parse(JSON.stringify(template.default_payment_schedule))
        : { subtotal_sar: 0, vat_rate: 15, vat_amount: 0, total_sar: 0, bank_iban: 'SA865134841770007', bank_name: 'بنك البلاد', account_holder: 'شركة دراية الذكية لتقنية المعلومات', tasks: [], installments: [] },
      appendices: template?.default_appendices ? JSON.parse(JSON.stringify(template.default_appendices)) : [],
      attachments: [],
      versions: [],
      template_id: template ? template.id : undefined,
    };
    setContract(newContract);
    setIsSelectingTemplate(false);
  };

  if (isSelectingTemplate) {
    return (
      <div className="flex flex-col h-full bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto w-full space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{t('إنشاء عقد جديد', 'Create New Contract', lang)}</h1>
              <p className="text-slate-500 mt-1">{t('اختر قالباً للبدء أو ابدأ بعقد فارغ', 'Choose a template or start empty', lang)}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X size={24} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button onClick={() => handleSelectTemplate(null)} className="flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-100"><FileText size={32} className="text-slate-400 group-hover:text-emerald-600" /></div>
              <h3 className="text-lg font-bold text-slate-800">{t('عقد فارغ', 'Empty Contract', lang)}</h3>
              <p className="text-sm text-slate-500 text-center mt-2">{t('ابدأ من الصفر بدون بنود مسبقة', 'Start from scratch', lang)}</p>
            </button>
            {templates.map((tpl: ContractTemplate) => (
              <button key={tpl.id} onClick={() => handleSelectTemplate(tpl)} className="flex flex-col items-start p-6 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all text-right">
                <div className="flex justify-between w-full mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center"><FileCode2 size={24} className="text-blue-600" /></div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 h-6">{tpl.category}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{tpl.name_ar}</h3>
                {tpl.description && <p className="text-sm text-slate-500 mb-4 line-clamp-2">{tpl.description}</p>}
                <div className="mt-auto flex items-center space-x-4 space-x-reverse text-xs text-slate-400">
                  <span className="flex items-center"><FileText size={14} className="ml-1" /> {tpl.default_articles.length} بنود</span>
                  <span>{tpl.default_type}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!contract) return <div className="p-8">Loading...</div>;

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      let updatedContract = { ...contract };
      if (contractId) {
        const orig = contracts.find((c: Contract) => c.id === contractId);
        if (orig) {
          const cur = { ...contract, versions: [] };
          const old = { ...orig, versions: [] };
          if (JSON.stringify(cur) !== JSON.stringify(old)) {
            let summary = 'تحديث تلقائي للعقد';
            if (JSON.stringify(contract.articles) !== JSON.stringify(orig.articles)) summary = 'تحديث البنود';
            else if (JSON.stringify(contract.payment_schedule) !== JSON.stringify(orig.payment_schedule)) summary = 'تحديث الدفعات';
            else if (JSON.stringify(contract.appendices) !== JSON.stringify(orig.appendices)) summary = 'تحديث الملاحق';
            else summary = 'تحديث معلومات العقد';
            const lastVer = contract.versions.length > 0 ? Math.max(...contract.versions.map((v: ContractVersion) => v.version_number)) : 0;
            const { versions: _v, ...noVer } = contract;
            const newVer: ContractVersion = { version_number: lastVer + 1, created_at: new Date().toISOString(), change_summary: summary, snapshot: JSON.parse(JSON.stringify({ ...noVer, versions: [] })) as Omit<Contract, 'versions'> };
            updatedContract.versions = [newVer, ...contract.versions];
          }
        }
        await onSaveEdit(contractId, updatedContract);
      } else {
        const { versions: _v, ...noVer } = contract;
        const newVer: ContractVersion = { version_number: 1, created_at: new Date().toISOString(), change_summary: 'إنشاء العقد', snapshot: JSON.parse(JSON.stringify({ ...noVer, versions: [] })) as Omit<Contract, 'versions'> };
        updatedContract.versions = [newVer];
        await onSaveNew(updatedContract);
      }
      onClose();
    } catch (err) {
      console.error('[ContractEditor] save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsTemplate = () => { setSaveAsTemplateName(contract.title_ar || ''); setSaveAsTemplateModal(true); };

  const confirmSaveAsTemplate = async () => {
    if (!saveAsTemplateName.trim()) return;
    const newTpl: ContractTemplate = {
      id: Date.now().toString(), name_ar: saveAsTemplateName.trim(), category: 'مخصص',
      default_status: 'مسودة', default_type: contract.type,
      default_articles: JSON.parse(JSON.stringify(contract.articles)),
      default_payment_schedule: JSON.parse(JSON.stringify(contract.payment_schedule)),
      default_appendices: JSON.parse(JSON.stringify(contract.appendices)),
      tags: contract.tags ? [...contract.tags] : [], is_default: false,
    };
    await onSaveTemplate(newTpl);
    setSaveAsTemplateModal(false);
    setSaveAsTemplateFeedback('success');
    setTimeout(() => setSaveAsTemplateFeedback(null), 3000);
  };

  const tabs = [
    { id: 'metadata',    label_ar: 'معلومات العقد',   label_en: 'Parties & Info', icon: Users },
    { id: 'articles',    label_ar: 'البنود',           label_en: 'Articles',       icon: FileText },
    { id: 'payments',    label_ar: 'المدفوعات',       label_en: 'Payments',       icon: CreditCard },
    { id: 'appendices',  label_ar: 'الملاحق',         label_en: 'Appendices',     icon: FileText },
    { id: 'attachments', label_ar: 'المرفقات',       label_en: 'Attachments',    icon: Paperclip },
    { id: 'versions',    label_ar: 'الإصدارات',       label_en: 'Versions',       icon: History },
    { id: 'preview',     label_ar: 'معاينة العقد',  label_en: 'Preview',        icon: Eye },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 no-print">
        <div className="flex items-center space-x-4 space-x-reverse">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={20} /></button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{contract.contract_number}</h1>
            <p className="text-sm text-slate-500">{contract.status}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          {saveAsTemplateFeedback === 'success' && (
            <span className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <CheckCircle size={14} /> {t('تم حفظ القالب', 'Template saved', lang)}
            </span>
          )}
          <button onClick={handleSaveAsTemplate} className="flex items-center space-x-2 space-x-reverse bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium">
            <FileCode2 size={18} /><span>{t('حفظ كقالب', 'Save as Template', lang)}</span>
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center space-x-2 space-x-reverse bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-medium">
            <Save size={18} /><span>{saving ? t('جارٍ...', 'Saving...', lang) : t('حفظ العقد', 'Save Contract', lang)}</span>
          </button>
        </div>
      </header>

      {saveAsTemplateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center no-print" dir="rtl">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{t('حفظ كقالب جديد', 'Save New Template', lang)}</h3>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('اسم القالب', 'Template name', lang)}</label>
            <input type="text" dir="rtl" value={saveAsTemplateName} onChange={e => setSaveAsTemplateName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmSaveAsTemplate()} autoFocus
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none mb-5"
              placeholder={t('مثال: قالب تطوير منصة SaaS', 'e.g. SaaS Template', lang)} />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setSaveAsTemplateModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">{t('إلغاء', 'Cancel', lang)}</button>
              <button onClick={confirmSaveAsTemplate} disabled={!saveAsTemplateName.trim()}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm">
                <FileCode2 size={16} /> {t('حفظ القالب', 'Save Template', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-white border-l border-slate-200 flex flex-col shrink-0 no-print">
          <div className="p-4 space-y-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)}
                className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                }`}>
                <tab.icon size={18} className={activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400'} />
                <span>{t(tab.label_ar, tab.label_en, lang)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            {activeTab === 'metadata'    && <MetadataEditor    contract={contract} setContract={setContract} lang={lang} projects={projects} clients={clients} templates={templates} />}
            {activeTab === 'articles'    && <ArticlesEditor    contract={contract} setContract={setContract} lang={lang} />}
            {activeTab === 'payments'    && <PaymentsEditor    contract={contract} setContract={setContract} lang={lang} />}
            {activeTab === 'appendices'  && <AppendicesEditor  contract={contract} setContract={setContract} lang={lang} />}
            {activeTab === 'attachments' && <AttachmentsEditor contract={contract} setContract={setContract} lang={lang} />}
            {activeTab === 'versions'    && <VersionsEditor    contract={contract} setContract={setContract} lang={lang} />}
            {activeTab === 'preview'     && <ContractPreview   contract={contract} lang={lang} projects={projects} clients={clients || []} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MetadataEditor
// ─────────────────────────────────────────────────────────────────────────────
function MetadataEditor({ contract, setContract, lang, projects, clients, templates }: any) {
  const { settings, getDefaultEntity } = useSettings();
  const selectedProject = projects?.find((p: any) => p.id === contract.project_id);
  const showClientWarning = selectedProject && selectedProject.client_id !== contract.client_id;
  const selectedTemplate = templates?.find((tpl: ContractTemplate) => tpl.id === contract.template_id);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
      <div>
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
          <h2 className="text-lg font-bold text-slate-800">{t('معلومات العقد', 'Contract Information', lang)}</h2>
          {selectedTemplate && (
            <div className="flex items-center space-x-2 space-x-reverse bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-100">
              <FileCode2 size={16} /><span>{t('قالب', 'Template', lang)}: {selectedTemplate.name_ar}</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('عنوان العقد', 'Contract Title', lang)}</label>
            <input type="text" dir="rtl" value={contract.title_ar} onChange={e => setContract({...contract, title_ar: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('نوع العقد', 'Contract Type', lang)}</label>
            <select value={contract.type} onChange={e => setContract({...contract, type: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="تطوير برمجيات">تطوير برمجيات</option>
              <option value="اشتراك/SaaS">اشتراك/SaaS</option>
              <option value="إنتاج محتوى">إنتاج محتوى</option>
              <option value="مختلط">مختلط</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('المشروع', 'Project', lang)}</label>
            <select value={contract.project_id || ''} onChange={e => {
              const pid = e.target.value;
              const proj = projects?.find((p: any) => p.id === pid);
              if (proj) setContract({ ...contract, project_id: pid, client_id: proj.client_id });
              else setContract({ ...contract, project_id: undefined });
            }} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="">{t('بدون مشروع', 'No project', lang)}</option>
              {projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name_ar}</option>)}
            </select>
            {selectedProject && (
              <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600 space-y-1">
                <div className="flex justify-between"><span className="text-slate-500">{t('النوع', 'Type', lang)}:</span><span className="font-medium">{selectedProject.project_type}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{t('العميل', 'Client', lang)}:</span><span className="font-medium">{(clients || []).find((c: any) => c.id === selectedProject.client_id)?.name_ar || t('غير معروف', 'Unknown', lang)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{t('القيمة', 'Value', lang)}:</span><span className="font-medium">{selectedProject.amount_sar.toLocaleString('ar-SA')} {t('ر.س', 'SAR', lang)}</span></div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('الجهة المُصدِرة (الطرف الأول)', 'Issuing Entity (Party One)', lang)}</label>
            <select value={contract.entity_id || getDefaultEntity().id} onChange={e => setContract({ ...contract, entity_id: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
              {settings.entities.map((e: any) => <option key={e.id} value={e.id}>{e.name_ar} {e.is_default ? `(${t('الافتراضي', 'default', lang)})` : ''}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('حالة العقد', 'Status', lang)}</label>
            <select value={contract.status} onChange={e => {
              const s = e.target.value; setContract({...contract, status: s});
              if (s === 'موقّع') platformBus.emit(PLATFORM_EVENTS.CONTRACT_SIGNED, { contractId: contract.id, contractTitle: contract.title_ar, counterpartyId: contract.client_id, projectId: contract.project_id, amount: contract.payment_schedule.total_sar, currency: 'SAR' });
            }} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
              {['مسودة','قيد المراجعة','معتمد','موقّع','نشط','مكتمل','منتهي'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('العميل (الطرف الثاني)', 'Client (Party Two)', lang)}</label>
            <select value={contract.client_id} onChange={e => setContract({...contract, client_id: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
              {!contract.client_id && <option value="">-- {t('اختر عميلاً', 'Select a client', lang)} --</option>}
              {(clients || []).map((c: any) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select>
            {!contract.client_id && clients?.length > 0 && <p className="text-xs text-amber-600">{t('يرجى تحديد العميل لظهوره في المعاينة', 'Select a client for preview', lang)}</p>}
            {showClientWarning && <p className="text-xs text-amber-600 mt-1">{t('سيتم تحديث العميل تلقائياً', 'Client will be updated automatically', lang)}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('تاريخ البدء', 'Start Date', lang)}</label>
            <input type="date" value={contract.start_date} onChange={e => { const d = e.target.value; setContract({...contract, start_date: d, hijri_date: toHijri(d)}); }} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            <p className="text-xs text-slate-500 mt-1">{contract.hijri_date}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('تاريخ الانتهاء', 'End Date', lang)}</label>
            <input type="date" value={contract.end_date || ''} onChange={e => setContract({...contract, end_date: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium text-slate-700">{t('الوسوم (مفصولة بفاصلة)', 'Tags (comma separated)', lang)}</label>
            <input type="text" dir="rtl" value={contract.tags?.join('، ') || ''} onChange={e => setContract({...contract, tags: e.target.value.split('،').map((s: string) => s.trim()).filter(Boolean)})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>
      </div>
      {(() => {
        const sel = settings.entities.find((e: any) => e.id === (contract.entity_id || getDefaultEntity().id)) || getDefaultEntity();
        return (
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-lg font-bold text-slate-800">{t('بيانات الطرف الأول', 'Party One Details', lang)}</h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{t('تُقرأ من إعدادات الجهة', 'Read from entity settings', lang)}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-700" dir="rtl">
              <div className="flex items-start gap-3 mb-4">
                {sel.logo_base64 && <img src={sel.logo_base64} alt="logo" className="h-14 w-28 object-contain border border-slate-200 rounded-lg p-1 bg-white shrink-0" />}
                <div>
                  <p className="text-base font-bold text-slate-800">{sel.name_ar}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t('س.ت', 'CR', lang)}: {sel.cr_number}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm border-t border-slate-200 pt-4">
                <div className="flex gap-2"><span className="text-slate-500 shrink-0">{t('الممثل', 'Representative', lang)}:</span><span className="font-medium">{sel.representative_name} — {sel.representative_title}</span></div>
                <div className="flex gap-2"><span className="text-slate-500 shrink-0">{t('العنوان', 'Address', lang)}:</span><span>{sel.city} — {sel.address}</span></div>
                <div className="flex gap-2"><span className="text-slate-500 shrink-0">{t('الهاتف', 'Phone', lang)}:</span><span dir="ltr">{sel.phone}</span></div>
                <div className="flex gap-2"><span className="text-slate-500 shrink-0">{t('البريد', 'Email', lang)}:</span><span dir="ltr">{sel.email}</span></div>
                <div className="flex gap-2"><span className="text-slate-500 shrink-0">{t('البنك', 'Bank', lang)}:</span><span>{sel.bank_name} — {sel.account_holder}</span></div>
                <div className="flex gap-2 col-span-2"><span className="text-slate-500 shrink-0">{t('الآيبان', 'IBAN', lang)}:</span><span dir="ltr" className="font-mono">{sel.bank_iban}</span></div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ArticlesEditor
// ─────────────────────────────────────────────────────────────────────────────
export function ArticlesEditor({ contract, setContract, lang }: any) {
  const addArticle = () => setContract({ ...contract, articles: [...contract.articles, { id: Date.now().toString(), order_index: contract.articles.length + 1, title_ar: 'بند جديد', body_ar: '', article_type: 'مخصص', is_locked: false, is_visible: true } as Article] });
  const updateArticle = (id: string, field: keyof Article, value: any) => setContract({ ...contract, articles: contract.articles.map((a: Article) => a.id === id ? { ...a, [field]: value } : a) });
  const deleteArticle = (id: string) => setContract({ ...contract, articles: contract.articles.filter((a: Article) => a.id !== id).map((a: Article, idx: number) => ({ ...a, order_index: idx + 1 })) });
  const moveArticle = (index: number, dir: 'up' | 'down') => {
    if (dir === 'up' && index === 0) return;
    if (dir === 'down' && index === contract.articles.length - 1) return;
    const arr = [...contract.articles]; const ti = dir === 'up' ? index - 1 : index + 1; [arr[index], arr[ti]] = [arr[ti], arr[index]];
    setContract({ ...contract, articles: arr.map((a, i) => ({ ...a, order_index: i + 1 })) });
  };
  const addBlock = (articleId: string, type: 'paragraph' | 'list' | 'page_break') => {
    const art = contract.articles.find((a: Article) => a.id === articleId); if (!art) return;
    const id = Date.now().toString();
    const b: ArticleBlock = type === 'paragraph' ? { id, type: 'paragraph', text_ar: '' } : type === 'list' ? { id, type: 'list', style: 'unordered', items: [{ id: id + '1', text_ar: '' }] } : { id, type: 'page_break' };
    updateArticle(articleId, 'blocks', [...(art.blocks || []), b]);
  };
  const updateBlock = (articleId: string, blockId: string, updates: Partial<ArticleBlock>) => { const art = contract.articles.find((a: Article) => a.id === articleId); if (!art?.blocks) return; updateArticle(articleId, 'blocks', art.blocks.map((b: ArticleBlock) => b.id === blockId ? { ...b, ...updates } : b)); };
  const deleteBlock = (articleId: string, blockId: string) => { const art = contract.articles.find((a: Article) => a.id === articleId); if (!art?.blocks) return; updateArticle(articleId, 'blocks', art.blocks.filter((b: ArticleBlock) => b.id !== blockId)); };
  const moveBlock = (articleId: string, index: number, dir: 'up' | 'down') => { const art = contract.articles.find((a: Article) => a.id === articleId); if (!art?.blocks) return; if (dir === 'up' && index === 0) return; if (dir === 'down' && index === art.blocks.length - 1) return; const arr = [...art.blocks]; const ti = dir === 'up' ? index - 1 : index + 1; [arr[index], arr[ti]] = [arr[ti], arr[index]]; updateArticle(articleId, 'blocks', arr); };
  const convertToBlocks = (articleId: string) => { const art = contract.articles.find((a: Article) => a.id === articleId); if (!art) return; updateArticle(articleId, 'blocks', [{ id: Date.now().toString(), type: 'paragraph', text_ar: art.body_ar || '' } as ParagraphBlock]); };

  const articleTypes = ['تمهيد','موضوع','مدة التنفيذ','القيمة والدفعات','الملكية الفكرية','إدارة المشروع','طلبات التغيير','إنهاء الاتفاقية','أحكام عامة','نسخ الاتفاقية','مخصص'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">{t('بنود العقد', 'Contract Articles', lang)}</h2>
        <button onClick={addArticle} className="flex items-center space-x-2 space-x-reverse text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
          <Plus size={16} /><span>{t('إضافة بند', 'Add Article', lang)}</span>
        </button>
      </div>
      <div className="space-y-4">
        {contract.articles.map((article: Article, index: number) => (
          <div key={article.id} className={`bg-white rounded-xl shadow-sm border ${article.is_visible ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-50'} overflow-hidden`}>
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="flex flex-col space-y-1 ml-2">
                  <button onClick={() => moveArticle(index, 'up')} className="text-slate-400 hover:text-emerald-600"><ArrowUp size={14} /></button>
                  <button onClick={() => moveArticle(index, 'down')} className="text-slate-400 hover:text-emerald-600"><ArrowDown size={14} /></button>
                </div>
                <span className="text-sm font-bold text-slate-500 w-16">{t('البند', 'Article', lang)} {index + 1}</span>
                <input type="text" dir="rtl" value={article.title_ar} onChange={e => updateArticle(article.id, 'title_ar', e.target.value)} disabled={article.is_locked} className="bg-transparent border-none focus:ring-0 font-bold text-slate-800 w-48 px-0 outline-none disabled:opacity-70" />
                <select value={article.article_type} onChange={e => updateArticle(article.id, 'article_type', e.target.value)} disabled={article.is_locked} className="text-xs bg-white border border-slate-200 rounded px-2 py-1 outline-none disabled:opacity-70">
                  {articleTypes.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button onClick={() => updateArticle(article.id, 'is_visible', !article.is_visible)} className={`p-1.5 rounded ${article.is_visible ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}><Eye size={16} /></button>
                <button onClick={() => updateArticle(article.id, 'is_locked', !article.is_locked)} className={`p-1.5 rounded ${article.is_locked ? 'text-amber-600 bg-amber-50' : 'text-slate-400 bg-slate-100'}`}>{article.is_locked ? <Lock size={16} /> : <Unlock size={16} />}</button>
                <button onClick={() => deleteArticle(article.id)} className="text-slate-400 hover:text-red-500 p-1.5"><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="p-4 relative">
              {article.blocks ? (
                <div className="space-y-4">
                  {article.blocks.map((block: ArticleBlock, bIndex: number) => (
                    <div key={block.id} className="relative group bg-white border border-slate-200 rounded-lg p-3">
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 space-x-reverse bg-white shadow-sm border border-slate-100 rounded-md p-1 z-10">
                        <button onClick={() => moveBlock(article.id, bIndex, 'up')} disabled={bIndex === 0 || article.is_locked} className="p-1 text-slate-400 hover:text-emerald-600 disabled:opacity-50"><ArrowUp size={14} /></button>
                        <button onClick={() => moveBlock(article.id, bIndex, 'down')} disabled={bIndex === article.blocks!.length - 1 || article.is_locked} className="p-1 text-slate-400 hover:text-emerald-600 disabled:opacity-50"><ArrowDown size={14} /></button>
                        <div className="w-px h-4 bg-slate-200 mx-1" />
                        <button onClick={() => deleteBlock(article.id, block.id)} disabled={article.is_locked} className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-50"><Trash2 size={14} /></button>
                      </div>
                      {block.type === 'paragraph' && <textarea dir="rtl" value={block.text_ar} onChange={e => updateBlock(article.id, block.id, { text_ar: e.target.value })} disabled={article.is_locked} className="w-full min-h-[80px] p-2 bg-transparent border-none focus:ring-0 outline-none resize-y text-slate-700 disabled:text-slate-500" placeholder={t('نص الفقرة...', 'Paragraph text...', lang)} />}
                      {block.type === 'list' && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 space-x-reverse mb-2">
                            <span className="text-xs font-medium text-slate-500">{t('نمط القائمة', 'List style', lang)}:</span>
                            <select value={block.style} onChange={e => updateBlock(article.id, block.id, { style: e.target.value as any })} disabled={article.is_locked} className="text-xs border border-slate-200 rounded px-2 py-1 outline-none">
                              <option value="unordered">{t('نقطية', 'Bullet', lang)}</option>
                              <option value="ordered">{t('رقمية', 'Numbered', lang)}</option>
                              <option value="alpha">{t('أبجدية', 'Alpha', lang)}</option>
                            </select>
                          </div>
                          {block.items.map((item, iIndex) => (
                            <div key={item.id} className="flex items-start space-x-2 space-x-reverse">
                              <span className="mt-2 text-slate-400 text-xs w-4 text-center">{block.style === 'ordered' ? `${iIndex + 1}.` : block.style === 'alpha' ? `${String.fromCharCode(1575 + iIndex)}.` : '•'}</span>
                              <input type="text" dir="rtl" value={item.text_ar} onChange={e => { const ni = [...block.items]; ni[iIndex].text_ar = e.target.value; updateBlock(article.id, block.id, { items: ni }); }} disabled={article.is_locked} className="flex-1 p-1.5 border-b border-transparent hover:border-slate-200 focus:border-emerald-500 bg-transparent outline-none" />
                              {!article.is_locked && <button onClick={() => updateBlock(article.id, block.id, { items: block.items.filter((_, i) => i !== iIndex) })} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><X size={14} /></button>}
                            </div>
                          ))}
                          {!article.is_locked && <button onClick={() => updateBlock(article.id, block.id, { items: [...block.items, { id: Date.now().toString(), text_ar: '' }] })} className="text-xs text-emerald-600 font-medium flex items-center space-x-1 space-x-reverse mt-2"><Plus size={12} /> <span>{t('إضافة عنصر', 'Add item', lang)}</span></button>}
                        </div>
                      )}
                      {block.type === 'page_break' && <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 text-slate-400"><FileMinus size={24} className="mb-2 opacity-50" /><span className="text-sm font-medium">{t('فاصل صفحة', 'Page break', lang)}</span></div>}
                    </div>
                  ))}
                  {!article.is_locked && (
                    <div className="flex items-center space-x-2 space-x-reverse pt-2 border-t border-slate-100">
                      <button onClick={() => addBlock(article.id, 'paragraph')} className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-medium"><AlignRight size={14} /> <span>{t('إضافة فقرة', 'Add paragraph', lang)}</span></button>
                      <button onClick={() => addBlock(article.id, 'list')} className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-medium"><ListOrdered size={14} /> <span>{t('إضافة قائمة', 'Add list', lang)}</span></button>
                      <button onClick={() => addBlock(article.id, 'page_break')} className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-medium"><FileMinus size={14} /> <span>{t('فاصل صفحة', 'Page break', lang)}</span></button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea dir="rtl" value={article.body_ar} onChange={e => updateArticle(article.id, 'body_ar', e.target.value)} disabled={article.is_locked} className={`w-full h-32 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-y ${article.is_locked ? 'bg-slate-100 cursor-not-allowed text-slate-400' : ''}`} placeholder={t('نص البند...', 'Article text...', lang)} />
                  {!article.is_locked && <button onClick={() => convertToBlocks(article.id)} className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md">{t('الترقية إلى كتل المحتوى (Blocks)', 'Upgrade to Blocks', lang)}</button>}
                </div>
              )}
              {article.is_locked && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="bg-white/90 px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse text-slate-500 shadow-sm border border-slate-100"><Lock size={16} /><span className="text-sm font-medium">{t('هذا البند محمي', 'This article is locked', lang)}</span></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PaymentsEditor
// ─────────────────────────────────────────────────────────────────────────────
export function PaymentsEditor({ contract, setContract, lang }: any) {
  const schedule = contract.payment_schedule;
  const upd = (u: Partial<PaymentSchedule>) => setContract({ ...contract, payment_schedule: { ...schedule, ...u } });
  const taskLogic = (tasks: TaskRow[], insts: Installment[]) => {
    const sub = tasks.reduce((s: number, t: TaskRow) => s + Number(t.cost_sar || 0), 0);
    const vat = sub * (schedule.vat_rate / 100); const total = sub + vat;
    upd({ tasks, subtotal_sar: sub, vat_amount: vat, total_sar: total, installments: insts.map((i: Installment) => ({ ...i, amount_sar: total * (i.percentage / 100), amount_words_ar: numberToArabicWords(total * (i.percentage / 100)) })) });
  };
  const addTask  = () => taskLogic([...schedule.tasks, { id: Date.now().toString(), task_name_ar: 'مهمة جديدة', duration: '', cost_sar: 0, frequency: 'مرة واحدة' }], schedule.installments);
  const updTask  = (id: string, f: keyof TaskRow, v: any) => taskLogic(schedule.tasks.map((t: TaskRow) => t.id === id ? { ...t, [f]: v } : t), schedule.installments);
  const rmTask   = (id: string) => taskLogic(schedule.tasks.filter((t: TaskRow) => t.id !== id), schedule.installments);
  const addInst  = () => upd({ installments: [...schedule.installments, { id: Date.now().toString(), label_ar: 'دفعة جديدة', trigger_event: 'توقيع العقد', percentage: 0, amount_sar: 0, amount_words_ar: 'صفر ريال سعودي' }] });
  const updInst  = (id: string, f: keyof Installment, v: any) => upd({ installments: schedule.installments.map((i: Installment) => { if (i.id !== id) return i; const u = { ...i, [f]: v }; if (f === 'percentage') { const a = schedule.total_sar * (Number(v) / 100); u.amount_sar = a; u.amount_words_ar = numberToArabicWords(a); } return u; }) });
  const rmInst   = (id: string) => upd({ installments: schedule.installments.filter((i: Installment) => i.id !== id) });
  const totalPct = schedule.installments.reduce((s: number, i: Installment) => s + Number(i.percentage || 0), 0);
  const triggerEvents = ['توقيع العقد','اعتماد المتطلبات','الإطلاق التجريبي','الإطلاق','مخصص'];

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">{t('المهام والتكاليف', 'Tasks & Costs', lang)}</h3>
          <button onClick={addTask} className="text-sm font-medium text-emerald-600 flex items-center space-x-1 space-x-reverse"><Plus size={16} /> <span>{t('إضافة مهمة', 'Add Task', lang)}</span></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200"><tr>
              <th className="px-6 py-3 font-medium">{t('المهمة','Task',lang)}</th><th className="px-6 py-3 font-medium">{t('المدة','Duration',lang)}</th><th className="px-6 py-3 font-medium">{t('التكلفة (ر.س)','Cost (SAR)',lang)}</th><th className="px-6 py-3 font-medium">{t('التكرار','Frequency',lang)}</th><th className="px-6 py-3 w-16"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {schedule.tasks.map((task: TaskRow) => (
                <tr key={task.id}>
                  <td className="px-6 py-3"><input type="text" dir="rtl" value={task.task_name_ar} onChange={e => updTask(task.id,'task_name_ar',e.target.value)} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none" /></td>
                  <td className="px-6 py-3"><input type="text" dir="rtl" value={task.duration} onChange={e => updTask(task.id,'duration',e.target.value)} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none" /></td>
                  <td className="px-6 py-3"><input type="number" value={task.cost_sar} onChange={e => updTask(task.id,'cost_sar',Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none" /></td>
                  <td className="px-6 py-3"><select value={task.frequency} onChange={e => updTask(task.id,'frequency',e.target.value)} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none"><option value="مرة واحدة">مرة واحدة</option><option value="سنوي">سنوي</option><option value="شهري">شهري</option></select></td>
                  <td className="px-6 py-3 text-center"><button onClick={() => rmTask(task.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr><td colSpan={2} className="px-6 py-3 text-left font-medium text-slate-600">{t('الإجمالي','Subtotal',lang)}</td><td className="px-6 py-3 font-bold text-slate-800">{schedule.subtotal_sar.toLocaleString()}</td><td colSpan={2}></td></tr>
              <tr><td colSpan={2} className="px-6 py-3 text-left font-medium text-slate-600">{t('ضريبة القيمة المضافة (15%)','VAT (15%)',lang)}</td><td className="px-6 py-3 font-bold text-slate-800">{schedule.vat_amount.toLocaleString()}</td><td colSpan={2}></td></tr>
              <tr className="bg-emerald-50"><td colSpan={2} className="px-6 py-3 text-left font-bold text-emerald-800">{t('الإجمالي الكلي','Total',lang)}</td><td className="px-6 py-3 font-bold text-emerald-800">{schedule.total_sar.toLocaleString()}</td><td colSpan={2}></td></tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center space-x-4 space-x-reverse">
            <h3 className="font-bold text-slate-800">{t('جدول الدفعات','Installments',lang)}</h3>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${totalPct===100?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700'}`}>{totalPct}%</span>
          </div>
          <button onClick={addInst} className="text-sm font-medium text-emerald-600 flex items-center space-x-1 space-x-reverse"><Plus size={16} /> <span>{t('إضافة دفعة','Add Installment',lang)}</span></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200"><tr>
              <th className="px-6 py-3 font-medium">{t('الدفعة','Label',lang)}</th><th className="px-6 py-3 font-medium">{t('الاستحقاق','Trigger',lang)}</th><th className="px-6 py-3 font-medium">{t('النسبة (%)','%',lang)}</th><th className="px-6 py-3 font-medium">{t('المبلغ','Amount',lang)}</th><th className="px-6 py-3 w-16"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {schedule.installments.map((inst: Installment) => (
                <tr key={inst.id}>
                  <td className="px-6 py-3"><input type="text" dir="rtl" value={inst.label_ar} onChange={e => updInst(inst.id,'label_ar',e.target.value)} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none" /></td>
                  <td className="px-6 py-3"><select value={inst.trigger_event} onChange={e => updInst(inst.id,'trigger_event',e.target.value)} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none">{triggerEvents.map(v => <option key={v} value={v}>{v}</option>)}</select></td>
                  <td className="px-6 py-3"><input type="number" value={inst.percentage} onChange={e => updInst(inst.id,'percentage',Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none" /></td>
                  <td className="px-6 py-3"><div className="font-medium text-slate-700">{inst.amount_sar.toLocaleString()} {t('ر.س','SAR',lang)}</div><div className="text-xs text-slate-500 mt-1">{inst.amount_words_ar}</div></td>
                  <td className="px-6 py-3 text-center"><button onClick={() => rmInst(inst.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-4">{t('البيانات البنكية','Bank Details',lang)}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="text-sm font-medium text-slate-700">{t('اسم البنك','Bank Name',lang)}</label><input type="text" value={schedule.bank_name} onChange={e => upd({bank_name:e.target.value})} className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          <div><label className="text-sm font-medium text-slate-700">{t('اسم الحساب','Account Holder',lang)}</label><input type="text" value={schedule.account_holder} onChange={e => upd({account_holder:e.target.value})} className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          <div><label className="text-sm font-medium text-slate-700">{t('رقم الآيبان','IBAN',lang)}</label><input type="text" dir="ltr" value={schedule.bank_iban} onChange={e => upd({bank_iban:e.target.value})} className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-left" /></div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AppendicesEditor
// ─────────────────────────────────────────────────────────────────────────────
export function AppendicesEditor({ contract, setContract, lang }: any) {
  const appendixTypes = ['قائمة الخدمات','التهيئة التقنية','العرض الفني','قائمة الأسعار','أخرى'];
  const add  = () => setContract({ ...contract, appendices: [...contract.appendices, { id: Date.now().toString(), order_index: contract.appendices.length + 1, title_ar: 'ملحق جديد', body_ar: '', appendix_type: 'أخرى' } as Appendix] });
  const upd  = (id: string, f: keyof Appendix, v: any) => setContract({ ...contract, appendices: contract.appendices.map((a: Appendix) => a.id === id ? { ...a, [f]: v } : a) });
  const del  = (id: string) => setContract({ ...contract, appendices: contract.appendices.filter((a: Appendix) => a.id !== id).map((a: Appendix, i: number) => ({ ...a, order_index: i + 1 })) });
  const move = (index: number, dir: 'up' | 'down') => {
    if (dir==='up'&&index===0) return; if (dir==='down'&&index===contract.appendices.length-1) return;
    const arr=[...contract.appendices]; const ti=dir==='up'?index-1:index+1; [arr[index],arr[ti]]=[arr[ti],arr[index]];
    setContract({...contract,appendices:arr.map((a,i)=>({...a,order_index:i+1}))});
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">{t('ملاحق العقد','Appendices',lang)}</h2>
        <button onClick={add} className="flex items-center space-x-2 space-x-reverse text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg"><Plus size={16}/><span>{t('إضافة ملحق','Add Appendix',lang)}</span></button>
      </div>
      <div className="space-y-4">
        {contract.appendices.map((app: Appendix, index: number) => (
          <div key={app.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="flex flex-col space-y-1 ml-2"><button onClick={() => move(index,'up')} className="text-slate-400 hover:text-emerald-600"><ArrowUp size={14} /></button><button onClick={() => move(index,'down')} className="text-slate-400 hover:text-emerald-600"><ArrowDown size={14} /></button></div>
                <span className="text-sm font-bold text-slate-500 w-16">{t('ملحق','Appendix',lang)} {index+1}</span>
                <input type="text" dir="rtl" value={app.title_ar} onChange={e => upd(app.id,'title_ar',e.target.value)} className="bg-transparent border-none focus:ring-0 font-bold text-slate-800 w-48 px-0 outline-none" />
                <select value={app.appendix_type} onChange={e => upd(app.id,'appendix_type',e.target.value)} className="text-xs bg-white border border-slate-200 rounded px-2 py-1 outline-none">
                  {appendixTypes.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <button onClick={() => del(app.id)} className="text-slate-400 hover:text-red-500 p-1.5"><Trash2 size={16} /></button>
            </div>
            <div className="p-4"><textarea dir="rtl" value={app.body_ar} onChange={e => upd(app.id,'body_ar',e.target.value)} className="w-full h-32 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-y" placeholder={t('محتوى الملحق...','Appendix content...',lang)} /></div>
          </div>
        ))}
        {contract.appendices.length===0&&<div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300"><p className="text-slate-500">{t('لا توجد ملاحق مضافة','No appendices added',lang)}</p></div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AttachmentsEditor
// ─────────────────────────────────────────────────────────────────────────────
function AttachmentsEditor({ contract, setContract, lang }: any) {
  const [showForm, setShowForm] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [newType, setNewType] = React.useState('أخرى');
  const attachmentTypes = ['العرض الفني','التصاميم','وثيقة النطاق','أخرى'];
  const add = () => {
    if (!newTitle.trim()) return;
    setContract({...contract, attachments:[...contract.attachments, { id: Date.now().toString(), title: newTitle.trim(), file_type: 'PDF', attachment_type: newType, uploaded_at: new Date().toISOString().split('T')[0] } as Attachment]});
    setNewTitle(''); setNewType('أخرى'); setShowForm(false);
  };
  const del = (id: string) => setContract({...contract, attachments: contract.attachments.filter((a: Attachment) => a.id !== id)});
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">{t('المرفقات','Attachments',lang)}</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center space-x-2 space-x-reverse text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg"><Plus size={16}/><span>{t('إضافة مرفق','Add Attachment',lang)}</span></button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-4 flex items-end gap-4">
          <div className="flex-1"><label className="text-sm font-medium text-slate-700">{t('اسم المرفق','Attachment name',lang)}</label><input type="text" dir="rtl" value={newTitle} onChange={e=>setNewTitle(e.target.value)} className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
          <div className="w-48"><label className="text-sm font-medium text-slate-700">{t('نوع المرفق','Type',lang)}</label><select value={newType} onChange={e=>setNewType(e.target.value)} className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">{attachmentTypes.map(v=><option key={v} value={v}>{v}</option>)}</select></div>
          <div className="flex gap-2"><button onClick={add} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium">{t('إضافة','Add',lang)}</button><button onClick={()=>setShowForm(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium">{t('إلغاء','Cancel',lang)}</button></div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200"><tr>
            <th className="px-6 py-3 font-medium">{t('اسم المرفق','Title',lang)}</th><th className="px-6 py-3 font-medium">{t('النوع','Type',lang)}</th><th className="px-6 py-3 font-medium">{t('تاريخ الرفع','Uploaded At',lang)}</th><th className="px-6 py-3 w-16"></th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {contract.attachments.map((a: Attachment) => (
              <tr key={a.id}><td className="px-6 py-4 font-medium text-slate-800">{a.title}</td><td className="px-6 py-4 text-slate-600">{a.attachment_type}</td><td className="px-6 py-4 text-slate-500">{a.uploaded_at}</td><td className="px-6 py-4 text-center"><button onClick={() => del(a.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button></td></tr>
            ))}
            {contract.attachments.length===0&&<tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">{t('لا توجد مرفقات','No attachments',lang)}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VersionsEditor
// ─────────────────────────────────────────────────────────────────────────────
function VersionsEditor({ contract, setContract, lang }: any) {
  const restore = (v: ContractVersion) => {
    if (confirm(t('هل أنت متأكد من استعادة هذا الإصدار؟', 'Restore this version?', lang)))
      setContract({ ...v.snapshot, versions: contract.versions });
  };
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-800">{t('سجل الإصدارات','Version History',lang)}</h2>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200"><tr>
            <th className="px-6 py-3 font-medium">{t('رقم الإصدار','Version',lang)}</th><th className="px-6 py-3 font-medium">{t('التاريخ','Date',lang)}</th><th className="px-6 py-3 font-medium">{t('ملخص التغيير','Summary',lang)}</th><th className="px-6 py-3 w-24"></th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {contract.versions.map((v: ContractVersion) => (
              <tr key={v.version_number}>
                <td className="px-6 py-4 font-bold text-slate-800">v{v.version_number}.0</td>
                <td className="px-6 py-4 text-slate-500" dir="ltr">{new Date(v.created_at).toLocaleString('ar-SA')}</td>
                <td className="px-6 py-4 text-slate-700">{v.change_summary}</td>
                <td className="px-6 py-4 text-center"><button onClick={() => restore(v)} className="text-emerald-600 hover:text-emerald-700 font-medium">{t('استعادة','Restore',lang)}</button></td>
              </tr>
            ))}
            {contract.versions.length===0&&<tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">{t('سيتم إنشاء الإصدارات تلقائياً عند حفظ العقد','Versions created automatically on save',lang)}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ContractPreview
// ─────────────────────────────────────────────────────────────────────────────
function ContractPreview({ contract, lang, projects, clients }: any) {
  const { getDefaultEntity, getEntityById } = useSettings();
  const entity   = (contract.entity_id ? getEntityById(contract.entity_id) : null) || getDefaultEntity();
  const colors   = { primary: entity.primary_color, secondary: entity.secondary_color, accent: entity.accent_color };
  const client   = (clients || []).find((c: any) => c.id === contract.client_id);
  const schedule = contract.payment_schedule;
  const visibleArticles = contract.articles.filter((a: Article) => a.is_visible).sort((a: Article, b: Article) => a.order_index - b.order_index);
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState(false);
  const [driveStatus, setDriveStatus] = React.useState<'idle'|'uploading'|'success'|'error'>('idle');
  const [driveLink, setDriveLink] = React.useState<string|null>(null);
  React.useEffect(() => { initGoogleDrive(); }, []);

  const san = (n: string) => n.replace(/[/\\?%*:|"<>]/g, '-').trim();

  const handleDrive = async () => {
    setDriveStatus('uploading'); setDriveLink(null);
    try {
      if (!isConnected()) await requestDriveAccess();
      const blob = await generatePdfBlob('contract-preview');
      const r = await uploadPdfToDrive(blob, san(`${contract.contract_number}-${contract.title_ar}.pdf`), entity.name_ar, client?.name_ar);
      setDriveLink(r.webViewLink); setDriveStatus('success');
    } catch(e) { console.error(e); setDriveStatus('error'); }
  };

  const handlePdf = async () => {
    setIsExporting(true);
    try { await exportContractToPdf('contract-preview', { filename: san(`${contract.contract_number}-${contract.title_ar}.pdf`), primaryColor: colors.primary }); }
    catch(e) { console.error(e); setExportError(true); setTimeout(() => setExportError(false), 4000); }
    finally { setIsExporting(false); }
  };

  const visibleCount = visibleArticles.length;
  const arNums: Record<number,string> = {1:'بند واحد',2:'بندين',3:'ثلاثة بنود',4:'أربعة بنود',5:'خمسة بنود',6:'ستة بنود',7:'سبعة بنود',8:'ثمانية بنود',9:'تسعة بنود',10:'عشرة بنود',11:'أحد عشر بنداً',12:'اثني عشر بنداً',13:'ثلاثة عشر بنداً',14:'أربعة عشر بنداً',15:'خمسة عشر بنداً'};
  const countLabel = arNums[visibleCount] || `${visibleCount} بنود`;

  return (
    <div>
      <div className="mb-4 flex justify-end gap-3 no-print sticky top-0 z-10 bg-slate-50 py-2">
        <button onClick={handleDrive} disabled={driveStatus==='uploading'} className="flex items-center space-x-2 space-x-reverse bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg font-medium">
          <Cloud size={18}/><span>{driveStatus==='uploading' ? t('جارٍ الرفع...','Uploading...',lang) : t('حفظ في Drive','Save to Drive',lang)}</span>
        </button>
        <button onClick={handlePdf} disabled={isExporting} className="flex items-center space-x-2 space-x-reverse bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg font-medium">
          <FileDown size={18}/><span>{isExporting ? t('جارٍ التصدير...','Exporting...',lang) : t('تصدير PDF','Export PDF',lang)}</span>
        </button>
        <button onClick={() => window.print()} className="flex items-center space-x-2 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium">
          <Printer size={18}/><span>{t('طباعة','Print',lang)}</span>
        </button>
      </div>
      {driveStatus==='success'&&driveLink&&(
        <div className="mb-4 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 no-print">
          <CheckCircle size={16}/><span>{t('تم الحفظ في Google Drive','Saved to Drive',lang)}</span>
          <a href={driveLink} target="_blank" rel="noopener noreferrer" className="mr-auto underline font-medium">{t('فتح الملف','Open file',lang)}</a>
        </div>
      )}
      {driveStatus==='error'&&(<div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2 no-print"><AlertCircle size={16}/><span>{t('فشل الرفع','Upload failed',lang)}</span></div>)}
      {exportError&&(<div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2 no-print"><AlertCircle size={16}/><span>{t('فشل تصدير PDF','PDF export failed',lang)}</span></div>)}

      <div id="contract-preview" className="bg-white shadow-xl border border-slate-200 p-12 max-w-4xl mx-auto text-slate-900 contract-pdf-ready" dir="rtl" style={{fontFamily:"'Tajawal', sans-serif"}}>
        <div className="flex justify-between items-start mb-8">
          <div>{entity.logo_base64 ? <img src={entity.logo_base64} alt="logo" className="h-20 max-w-[180px] object-contain" /> : <div className="h-20 w-[180px]" />}</div>
          <div className="text-left text-sm text-slate-500 leading-6">
            <p>{entity.name_ar}</p>
            <p>{t('س.ت','CR',lang)}: {entity.cr_number}</p>
            <p>{entity.city}</p>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-6">بسم الله الرحمن الرحيم</h1>
          <h2 className="text-xl font-bold">{contract.title_ar}</h2>
          <p className="text-sm text-slate-500 mt-2">{t('رقم العقد','Contract No.',lang)}: {contract.contract_number}</p>
          <p className="text-sm text-slate-500">{t('الميلادي','Date',lang)}: {contract.start_date} | {t('الهجري','Hijri',lang)}: {toHijri(contract.start_date)}</p>
        </div>

        <div className="mb-10 leading-relaxed text-lg">
          <p className="mb-4">{t('إنه في يوم الموافق','On this day',lang)} {contract.start_date}، {t('تم الاتفاق بين كل من','an agreement was made between',lang)}:</p>

          <div className="mb-6 bg-slate-50 p-4 rounded border border-slate-100">
            <p className="font-bold mb-2" style={{color:colors.primary}}>{t('الطرف الأول','Party One',lang)}: {entity.name_ar}</p>
            <div className="grid grid-cols-2 gap-2 text-base">
              <p>{t('سجل تجاري رقم','CR No.',lang)}: {entity.cr_number}</p>
              <p>{t('ويمثلها','Represented by',lang)}: {entity.representative_name} ({entity.representative_title})</p>
              <p>{t('العنوان','Address',lang)}: {entity.city} – {entity.address}</p>
              <p>{t('البريد','Email',lang)}: {entity.email}</p>
            </div>
          </div>

          <div className="mb-6 bg-slate-50 p-4 rounded border border-slate-100">
            {client ? (
              <>
                <p className="font-bold mb-3" style={{color:colors.primary}}>{t('الطرف الثاني','Party Two',lang)}: {client.name_ar}</p>
                <div className="grid grid-cols-2 gap-2 text-base">
                  <p>{t('السجل التجاري','CR',lang)}: {client.license_no||'—'}</p>
                  <p>{t('ويمثلها','Rep.',lang)}: {client.representative_name||'—'} — {client.representative_title||'—'}</p>
                  <p>{t('المدينة','City',lang)}: {client.city||'—'}</p>
                  <p>{t('العنوان','Address',lang)}: {client.address||'—'}</p>
                  {client.phone&&<p>{t('الهاتف','Phone',lang)}: <span dir="ltr">{client.phone}</span></p>}
                  {client.email&&<p>{t('البريد','Email',lang)}: <span dir="ltr">{client.email}</span></p>}
                </div>
              </>
            ) : (
              <p className="text-amber-600 font-medium">⚠️ {t('لم يتم تحديد العميل — يرجى اختياره في تبويب معلومات العقد', 'No client selected — please choose one in the Metadata tab', lang)}</p>
            )}
          </div>
        </div>

        <div className="space-y-8 text-lg">
          {visibleArticles.map((article: Article, idx: number) => {
            const repl = (s: string) => s.replace(/\b(واحد|اثنين|ثلاثة|أربعة|خمسة|ستة|سبعة|ثمانية|تسعة|عشرة|أحد عشر|اثني عشر|ثلاثة عشر|أربعة عشر|خمسة عشر)\s+بند[اً]?/g, countLabel);
            const displayBody = article.article_type==='نسخ الاتفاقية' ? repl(article.body_ar||'') : (article.body_ar||t('(نص البند فارغ)','(empty)',lang));
            return (
              <div key={article.id} className="article-block">
                <h3 className="text-xl font-bold mb-3" style={{color:colors.accent}}>{t('البند','Article',lang)} {idx+1}: {article.title_ar}</h3>
                {article.blocks&&article.blocks.length>0 ? (
                  <div className="space-y-4">
                    {article.blocks.map((block: ArticleBlock) => {
                      if (block.type==='paragraph') { const bt = article.article_type==='نسخ الاتفاقية' ? repl(block.text_ar||'') : block.text_ar; return <p key={block.id} className="whitespace-pre-wrap leading-relaxed text-justify">{bt}</p>; }
                      if (block.type==='list') { const LT = block.style==='ordered'||block.style==='alpha'?'ol':'ul'; const lc = block.style==='ordered'?'list-decimal':block.style==='alpha'?'list-[lower-alpha]':'list-disc'; return <LT key={block.id} className={`${lc} list-inside space-y-2 mr-4 leading-relaxed text-justify`}>{block.items.map(i=><li key={i.id}>{i.text_ar}</li>)}</LT>; }
                      if (block.type==='page_break') return <div key={block.id} className="contract-page-break">{t('فاصل صفحة','Page break',lang)}</div>;
                      return null;
                    })}
                  </div>
                ) : <div className="whitespace-pre-wrap leading-relaxed text-justify">{displayBody}</div>}

                {article.article_type==='القيمة والدفعات'&&schedule.tasks.length>0&&(
                  <div className="mt-6">
                    <table className="w-full border-collapse border border-slate-300 mb-6 text-base">
                      <thead style={{backgroundColor:colors.primary}}><tr>
                        <th className="border border-slate-300 px-4 py-2 text-right text-white font-medium">{t('المهمة','Task',lang)}</th>
                        <th className="border border-slate-300 px-4 py-2 text-right text-white font-medium">{t('المدة','Duration',lang)}</th>
                        <th className="border border-slate-300 px-4 py-2 text-right text-white font-medium">{t('التكلفة (ريال)','Cost (SAR)',lang)}</th>
                      </tr></thead>
                      <tbody>{schedule.tasks.map((task:TaskRow,i:number)=>(<tr key={task.id} style={{backgroundColor:i%2===0?colors.secondary:'#fff'}}><td className="border border-slate-300 px-4 py-2">{task.task_name_ar}</td><td className="border border-slate-300 px-4 py-2">{task.duration}</td><td className="border border-slate-300 px-4 py-2">{task.cost_sar.toLocaleString()}</td></tr>))}</tbody>
                      <tfoot style={{backgroundColor:'#f8fafc',fontWeight:'bold'}}>
                        <tr><td colSpan={2} className="border border-slate-300 px-4 py-2">{t('الإجمالي غير شامل الضريبة','Subtotal excl. VAT',lang)}</td><td className="border border-slate-300 px-4 py-2">{schedule.subtotal_sar.toLocaleString()}</td></tr>
                        <tr><td colSpan={2} className="border border-slate-300 px-4 py-2">{t('ضريبة القيمة المضافة','VAT',lang)} ({schedule.vat_rate}%)</td><td className="border border-slate-300 px-4 py-2">{schedule.vat_amount.toLocaleString()}</td></tr>
                        <tr style={{backgroundColor:colors.secondary}}><td colSpan={2} className="border border-slate-300 px-4 py-2" style={{color:colors.accent}}>{t('الإجمالي الكلي','Total',lang)}</td><td className="border border-slate-300 px-4 py-2" style={{color:colors.accent}}>{schedule.total_sar.toLocaleString()}</td></tr>
                      </tfoot>
                    </table>
                    {schedule.installments.length>0&&(
                      <div className="mb-6">
                        <p className="font-bold mb-2">{t('طريقة الدفع','Payment schedule',lang)}:</p>
                        <ul className="list-disc list-inside space-y-4 mr-4">
                          {schedule.installments.map((inst:Installment)=>(
                            <li key={inst.id}><span className="font-bold">{inst.label_ar}</span>: {inst.percentage}% {t('تستحق عند','due at',lang)} {inst.trigger_event}.<div className="mt-1 text-slate-700">{t('المبلغ','Amount',lang)}: {inst.amount_sar.toLocaleString()} {t('ريال','SAR',lang)} ({inst.amount_words_ar})</div></li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="p-4 border border-slate-200 rounded text-base" style={{backgroundColor:colors.secondary}}>
                      <p className="font-bold mb-2">{t('البيانات البنكية','Bank Details',lang)}:</p>
                      <p>{t('اسم البنك','Bank',lang)}: {schedule.bank_name}</p>
                      <p>{t('اسم الحساب','Account',lang)}: {schedule.account_holder}</p>
                      <p>{t('رقم الآيبان','IBAN',lang)}: <span dir="ltr">{schedule.bank_iban}</span></p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="mt-24 grid grid-cols-2 gap-12 text-center text-lg signature-block">
            <div><p className="font-bold mb-8">{t('الطرف الأول','Party One',lang)}</p><p>{t('الاسم','Name',lang)}: {entity.representative_name}</p><p className="mt-4">{t('التوقيع','Signature',lang)}: ___________________</p></div>
            <div><p className="font-bold mb-8">{t('الطرف الثاني','Party Two',lang)}</p><p>{t('الاسم','Name',lang)}: {client?.representative_name||'—'}</p><p className="mt-4">{t('التوقيع','Signature',lang)}: ___________________</p></div>
          </div>

          {contract.appendices.map((app:Appendix,idx:number)=>(
            <div key={app.id} className="contract-page-break" style={{pageBreakBefore:'always',marginTop:'48px',paddingTop:'32px',borderTop:'2px solid #1e293b'}}>
              {idx===0&&<h2 className="text-2xl font-bold mb-8 text-center">{t('الملاحق','Appendices',lang)}</h2>}
              <h3 className="text-xl font-bold mb-3" style={{color:colors.accent}}>{t('الملحق','Appendix',lang)} {idx+1}: {app.title_ar}</h3>
              <div className="whitespace-pre-wrap leading-relaxed text-justify">{app.body_ar||t('(نص الملحق فارغ)','(empty)',lang)}</div>
            </div>
          ))}

          {contract.attachments.length>0&&(
            <div className="contract-page-break" style={{pageBreakBefore:'always',marginTop:'48px',paddingTop:'32px',borderTop:'2px solid #1e293b'}}>
              <h2 className="text-2xl font-bold mb-8 text-center">{t('المرفقات','Attachments',lang)}</h2>
              <table className="w-full border-collapse border border-slate-300 text-base">
                <thead style={{backgroundColor:colors.primary}}><tr>
                  <th className="border border-slate-300 px-4 py-2 text-right text-white font-medium">{t('اسم المرفق','Title',lang)}</th>
                  <th className="border border-slate-300 px-4 py-2 text-right text-white font-medium">{t('النوع','Type',lang)}</th>
                  <th className="border border-slate-300 px-4 py-2 text-right text-white font-medium">{t('التاريخ','Date',lang)}</th>
                </tr></thead>
                <tbody>{contract.attachments.map((att:Attachment,i:number)=>(<tr key={att.id} style={{backgroundColor:i%2===0?colors.secondary:'#fff'}}><td className="border border-slate-300 px-4 py-2">{att.title}</td><td className="border border-slate-300 px-4 py-2">{att.attachment_type}</td><td className="border border-slate-300 px-4 py-2">{att.uploaded_at}</td></tr>))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
