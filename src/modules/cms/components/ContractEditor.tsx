import React, { useState, useEffect } from 'react';
import { Contract, Article, ArticleBlock, ParagraphBlock, ListBlock, PageBreakBlock, TaskRow, Installment, PaymentSchedule, Appendix, Attachment, ContractVersion, ContractTemplate } from '../types';
import { Save, X, Plus, Trash2, Eye, FileText, Users, CreditCard, Paperclip, History, Lock, Unlock, ArrowUp, ArrowDown, Printer, AlignRight, ListOrdered, FileMinus, FileCode2, FileDown, Cloud, CheckCircle, AlertCircle } from 'lucide-react';
import { useLang, t } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { numberToArabicWords } from '../utils/arabicWords';
import { toHijri } from '../utils/hijriDate';
import { exportContractToPdf, generatePdfBlob } from '../utils/exportPdf';
import {
  initGoogleDrive,
  requestDriveAccess,
  isConnected,
  uploadPdfToDrive,
} from '../services/googleDrive';
import { platformBus, PLATFORM_EVENTS } from '../../../core/events/platformBus';



type Tab = 'metadata' | 'articles' | 'payments' | 'appendices' | 'attachments' | 'versions' | 'preview';

const getDefaultArticles = (): Article[] => [
  {
    id: 'a1',
    order_index: 1,
    title_ar: 'التمهيد',
    body_ar: `يعتبر التمهيد السابق والمقدمة إضافةً إلى الملاحق المرفقة جزءاً لا يتجزأ من هذا العقد ومتممةً ومفسرةً لأحكامه.`,
    article_type: 'تمهيد',
    is_locked: true,
    is_visible: true
  },
  {
    id: 'a2',
    order_index: 2,
    title_ar: 'الموضوع',
    body_ar: `[عنوان العقد] لصالح الطرف الثاني ([اسم الطرف الثاني]) اعتماداً على العرض الفني المعتمد من قبل الطرفين والملحق مع هذا العقد.`,
    article_type: 'موضوع',
    is_locked: false,
    is_visible: true
  },
  {
    id: 'a3',
    order_index: 3,
    title_ar: 'مدة التنفيذ',
    body_ar: `يلتزم الطرف الأول بتنفيذ [عنوان العقد] لصالح الطرف الثاني خلال مدة لا تزيد عن ستة أشهر من تاريخ توقيع العقد من كلا الطرفين وتحويل الدفعة الأولى لحساب الطرف الأول.`,
    article_type: 'مدة التنفيذ',
    is_locked: false,
    is_visible: true
  },
  {
    id: 'a4',
    order_index: 4,
    title_ar: 'القيمة والدفعات',
    body_ar: `تبلغ قيمة العقد الإجمالية المبلغ المحدد في جدول الدفعات أدناه شاملةً ضريبة القيمة المضافة.\n\nيلتزم الطرف الثاني بإيداع جميع المستحقات المالية للطرف الأول في حسابه في بنك البلاد باسم شركة دراية الذكية لتقنية المعلومات.\n\nفي حال تأخر الطرف الثاني عن الرد خلال يومي عمل على مخاطبات الطرف الأول فلا تُحتسب المدة التي تزيد عن يومي العمل جزءاً من مدة التنفيذ.`,
    article_type: 'القيمة والدفعات',
    is_locked: false,
    is_visible: true
  },
  {
    id: 'a5',
    order_index: 5,
    title_ar: 'الملكية الفكرية',
    body_ar: `الملكية الفكرية للمشروع بمكوناته المختلفة هي ملك للطرف الثاني ولا يحق للطرف الأول طلب أي حقوق ملكية عن مخرجات المشروع بعد استلام كامل المستحقات المالية.`,
    article_type: 'الملكية الفكرية',
    is_locked: false,
    is_visible: true
  },
  {
    id: 'a6',
    order_index: 6,
    title_ar: 'آلية إدارة المشروع والدعم الفني',
    body_ar: `١. بعد الاتفاق وتوقيع العقد وإيداع الدفعة الأولى، يُعيّن الطرف الثاني مديراً للمشروع ممثلاً له في هذا التعاقد.\n٢. يتم الاجتماع الأولي بين مدير المشروع الممثل للطرف الثاني ومدير المشروع الممثل للطرف الأول للاتفاق على آليات سير المشروع.\n٣. يتم توثيق جميع الخطوات والاتفاقات لضمان مصلحة طرفي المشروع.\n٤. يلتزم الطرف الثاني بإفادة الطرف الأول عن ملاحظاته حول الأعمال التي يتم تنفيذها في كل مرحلة خلال يومي عمل.`,
    article_type: 'إدارة المشروع',
    is_locked: false,
    is_visible: true
  },
  {
    id: 'a7',
    order_index: 7,
    title_ar: 'آلية طلبات التغيير',
    body_ar: `في حالة قيام الطرف الثاني بطلب تعديل على نطاق العمل المتفق عليه، يقوم الطرف الثاني بالاجتماع مع الطرف الأول لشرح المتطلبات الجديدة، ويقوم الطرف الأول بتقييم المتطلبات وتحديد الجهد والتكلفة المطلوبتين لتنفيذ المتطلبات الجديدة، ولا يُعدّ أي طلب تغيير ملزماً إلا بعد توقيع ملحق تعديل من الطرفين.`,
    article_type: 'طلبات التغيير',
    is_locked: false,
    is_visible: true
  },
  {
    id: 'a8',
    order_index: 8,
    title_ar: 'إنهاء الاتفاقية',
    body_ar: `تنتهي هذه الاتفاقية في الحالات التالية:\n١. باكتمال المشروع وتسليمه بشكل نهائي.\n٢. باتفاق الطرفين على إنهاء المشروع قبل تنفيذه لأسباب يتفق عليها الطرفان كتابياً.\n٣. يحق لكلا الطرفين إنهاء العقد إذا أخل الطرف الآخر ببنوده بعد إنذار كتابي لمدة لا تقل عن شهر.\n٤. إذا لم يلتزم الطرف الثاني بإيداع الدفعة خلال أسبوعين من تاريخ استحقاقها.`,
    article_type: 'إنهاء الاتفاقية',
    is_locked: false,
    is_visible: true
  },
  {
    id: 'a9',
    order_index: 9,
    title_ar: 'أحكام عامة',
    body_ar: `١. يلتزم الطرفان بالأحكام والضوابط الشرعية في تنفيذ الأعمال الفنية.\n٢. يُقر الطرفان بأنهما قد اطلعا على كل بنود ومحتوى هذا العقد وتفهماها وأدركا مقاصدها إدراكاً نافياً للجهالة والغرر.\n٣. يكون العنوان النظامي لكل طرف هو العنوان المبين في تمهيد هذا العقد.\n٤. لا يُعتدّ بتعديل أي شرط من شروط هذا العقد ما لم يكن مكتوباً بملحق وموقعاً عليه من الطرفين.\n٥. يُعدّ هذا العقد ومالحقه نهائياً وملزماً للطرفين من تاريخ إبرام العقد وملغياً لأي عقد أو اتفاق سابق.`,
    article_type: 'أحكام عامة',
    is_locked: true,
    is_visible: true
  },
  {
    id: 'a10',
    order_index: 10,
    title_ar: 'نُسخ الاتفاقية',
    body_ar: `حُرِّر هذا العقد من عشرة بنود بنسختين أصليتين باللغة العربية، واستلم كل طرف نسخةً للعمل بموجبها، ويُعتبر توقيع الطرفين على هذا العقد إقراراً بصحته، وأن أي كشط أو تعديل غير متفق عليه من الطرفين يكون سبباً في إلغاء هذا العقد.\nوتوثيقاً لما تقدم فقد جرى التوقيع عليه في اليوم والسنة المبيّنين في تمهيده.\nوالله ولي التوفيق.`,
    article_type: 'نسخ الاتفاقية',
    is_locked: true,
    is_visible: true
  }
];

export default function ContractEditor({ contractId, onClose, contracts, setContracts, projects, clients, templates, setTemplates }: any) {
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState<Tab>('metadata');
  const [contract, setContract] = useState<Contract | null>(null);
  const [isSelectingTemplate, setIsSelectingTemplate] = useState(!contractId);

  useEffect(() => {
    if (contractId) {
      const existing = contracts.find((c: Contract) => c.id === contractId);
      if (existing) setContract(JSON.parse(JSON.stringify(existing)));
    }
  }, [contractId, contracts]);

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
      tags: template && template.tags ? [...template.tags] : [],
      articles: template ? JSON.parse(JSON.stringify(template.default_articles)) : getDefaultArticles(),
      payment_schedule: template && template.default_payment_schedule ? JSON.parse(JSON.stringify(template.default_payment_schedule)) : {
        subtotal_sar: 0,
        vat_rate: 15,
        vat_amount: 0,
        total_sar: 0,
        bank_iban: 'SA865134841770007',
        bank_name: 'بنك البلاد',
        account_holder: 'شركة دراية الذكية لتقنية المعلومات',
        tasks: [],
        installments: []
      },
      appendices: template && template.default_appendices ? JSON.parse(JSON.stringify(template.default_appendices)) : [],
      attachments: [],
      versions: [],
      template_id: template ? template.id : undefined
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
              <p className="text-slate-500 mt-1">{t('اختر قالباً للبدء أو ابدأ بعقد فارغ', 'Choose a template to start or start with an empty contract', lang)}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => handleSelectTemplate(null)}
              className="flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                <FileText size={32} className="text-slate-400 group-hover:text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">{t('عقد فارغ', 'Empty Contract', lang)}</h3>
              <p className="text-sm text-slate-500 text-center mt-2">{t('ابدأ من الصفر بدون بنود مسبقة', 'Start from scratch without predefined articles', lang)}</p>
            </button>

            {templates.map((template: ContractTemplate) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="flex flex-col items-start p-6 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all text-right"
              >
                <div className="flex justify-between w-full mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileCode2 size={24} className="text-blue-600" />
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 h-6">
                    {template.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{template.name_ar}</h3>
                {template.description && <p className="text-sm text-slate-500 mb-4 line-clamp-2">{template.description}</p>}
                <div className="mt-auto flex items-center space-x-4 space-x-reverse text-xs text-slate-400">
                  <span className="flex items-center"><FileText size={14} className="ml-1" /> {template.default_articles.length} بنود</span>
                  <span>{template.default_type}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!contract) return <div className="p-8">Loading...</div>;

  const handleSave = () => {
    let updatedContract = { ...contract };
    
    if (contractId) {
      const originalContract = contracts.find((c: Contract) => c.id === contractId);
      if (originalContract) {
        // Compare without versions
        const currentWithoutVersions = { ...contract, versions: [] };
        const originalWithoutVersions = { ...originalContract, versions: [] };
        
        if (JSON.stringify(currentWithoutVersions) !== JSON.stringify(originalWithoutVersions)) {
          // Determine what changed
          let summary = 'تحديث تلقائي للعقد';
          if (JSON.stringify(contract.articles) !== JSON.stringify(originalContract.articles)) {
            summary = 'تحديث البنود';
          } else if (JSON.stringify(contract.payment_schedule) !== JSON.stringify(originalContract.payment_schedule)) {
            summary = 'تحديث الدفعات';
          } else if (JSON.stringify(contract.appendices) !== JSON.stringify(originalContract.appendices)) {
            summary = 'تحديث الملاحق';
          } else if (
            contract.title_ar !== originalContract.title_ar ||
            contract.type !== originalContract.type ||
            contract.status !== originalContract.status ||
            contract.client_id !== originalContract.client_id ||
            contract.start_date !== originalContract.start_date ||
            contract.end_date !== originalContract.end_date ||
            JSON.stringify(contract.tags) !== JSON.stringify(originalContract.tags) ||
            contract.entity_id !== originalContract.entity_id
          ) {
            summary = 'تحديث معلومات العقد';
          }

          const lastVersion = contract.versions.length > 0 ? Math.max(...contract.versions.map((v: ContractVersion) => v.version_number)) : 0;
          const newVersion: ContractVersion = {
            version_number: lastVersion + 1,
            created_at: new Date().toISOString(),
            change_summary: summary,
            snapshot: JSON.parse(JSON.stringify(contract))
          };
          updatedContract.versions = [newVersion, ...contract.versions];
        }
      }
      setContracts(contracts.map((c: Contract) => c.id === contract.id ? updatedContract : c));
    } else {
      const newVersion: ContractVersion = {
        version_number: 1,
        created_at: new Date().toISOString(),
        change_summary: 'إنشاء العقد',
        snapshot: JSON.parse(JSON.stringify(contract))
      };
      updatedContract.versions = [newVersion];
      setContracts([...contracts, updatedContract]);
    }
    onClose();
  };

  const handleSaveAsTemplate = () => {
    const templateName = prompt('أدخل اسم القالب الجديد:', contract.title_ar);
    if (!templateName) return;

    const newTemplate: ContractTemplate = {
      id: Date.now().toString(),
      name_ar: templateName,
      category: 'مخصص',
      default_status: 'مسودة',
      default_type: contract.type,
      default_articles: JSON.parse(JSON.stringify(contract.articles)),
      default_payment_schedule: JSON.parse(JSON.stringify(contract.payment_schedule)),
      default_appendices: JSON.parse(JSON.stringify(contract.appendices)),
      tags: contract.tags ? [...contract.tags] : [],
      is_default: false
    };

    setTemplates([...templates, newTemplate]);
    alert('تم حفظ القالب بنجاح');
  };

  const tabs = [
    { id: 'metadata', label_ar: 'معلومات العقد', label_en: 'Parties & Info', icon: Users },
    { id: 'articles', label_ar: 'البنود', label_en: 'Articles', icon: FileText },
    { id: 'payments', label_ar: 'المدفوعات', label_en: 'Payments', icon: CreditCard },
    { id: 'appendices', label_ar: 'الملاحق', label_en: 'Appendices', icon: FileText },
    { id: 'attachments', label_ar: 'المرفقات', label_en: 'Attachments', icon: Paperclip },
    { id: 'versions', label_ar: 'الإصدارات', label_en: 'Versions', icon: History },
    { id: 'preview', label_ar: 'معاينة العقد', label_en: 'Preview', icon: Eye },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 no-print">
        <div className="flex items-center space-x-4 space-x-reverse">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <X size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{contract.contract_number}</h1>
            <p className="text-sm text-slate-500">{contract.status}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button onClick={handleSaveAsTemplate} className="flex items-center space-x-2 space-x-reverse bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors">
            <FileCode2 size={18} />
            <span>{t('حفظ كقالب', 'Save as Template', lang)}</span>
          </button>
          <button onClick={handleSave} className="flex items-center space-x-2 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            <Save size={18} />
            <span>{t('حفظ العقد', 'Save Contract', lang)}</span>
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
            {activeTab === 'metadata' && <MetadataEditor contract={contract} setContract={setContract} lang={lang} projects={projects} clients={clients} templates={templates} />}
            {activeTab === 'articles' && <ArticlesEditor contract={contract} setContract={setContract} lang={lang} />}
            {activeTab === 'payments' && <PaymentsEditor contract={contract} setContract={setContract} lang={lang} />}
            {activeTab === 'appendices' && <AppendicesEditor contract={contract} setContract={setContract} lang={lang} />}
            {activeTab === 'attachments' && <AttachmentsEditor contract={contract} setContract={setContract} lang={lang} />}
            {activeTab === 'versions' && <VersionsEditor contract={contract} setContract={setContract} lang={lang} />}
            {activeTab === 'preview' && <ContractPreview contract={contract} lang={lang} projects={projects} clients={clients || []} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetadataEditor({ contract, setContract, lang, projects, clients, templates }: any) {
  const { settings, getDefaultEntity } = useSettings();
  
  const selectedProject = projects?.find((p: any) => p.id === contract.project_id);
  const selectedClient = (clients || []).find((c: any) => c.id === contract.client_id);
  const showClientWarning = selectedProject && selectedProject.client_id !== contract.client_id;
  const selectedTemplate = templates?.find((t: ContractTemplate) => t.id === contract.template_id);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
      <div>
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
          <h2 className="text-lg font-bold text-slate-800">{t('معلومات العقد', 'Contract Information', lang)}</h2>
          {selectedTemplate && (
            <div className="flex items-center space-x-2 space-x-reverse bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-100">
              <FileCode2 size={16} />
              <span>قالب: {selectedTemplate.name_ar}</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('عنوان العقد', 'Contract Title', lang)}</label>
            <input 
              type="text" 
              dir="rtl"
              value={contract.title_ar} 
              onChange={e => setContract({...contract, title_ar: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('نوع العقد', 'Contract Type', lang)}</label>
            <select 
              value={contract.type}
              onChange={e => setContract({...contract, type: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="تطوير برمجيات">تطوير برمجيات</option>
              <option value="اشتراك/SaaS">اشتراك/SaaS</option>
              <option value="إنتاج محتوى">إنتاج محتوى</option>
              <option value="مختلط">مختلط</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">المشروع</label>
            <select
              value={contract.project_id || ''}
              onChange={e => {
                const projectId = e.target.value;
                const project = projects?.find((p: any) => p.id === projectId);
                if (project) {
                  setContract({ ...contract, project_id: projectId, client_id: project.client_id });
                } else {
                  setContract({ ...contract, project_id: undefined });
                }
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">بدون مشروع</option>
              {projects?.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name_ar}
                </option>
              ))}
            </select>
            {selectedProject && (
              <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">النوع:</span>
                  <span className="font-medium">{selectedProject.project_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">العميل:</span>
                  <span className="font-medium">{(clients || []).find((c: any) => c.id === selectedProject.client_id)?.name_ar || 'غير معروف'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">القيمة:</span>
                  <span className="font-medium">{selectedProject.amount_sar.toLocaleString('ar-SA')} ر.س</span>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">الجهة المُصدِرة (الطرف الأول)</label>
            <select
              value={contract.entity_id || getDefaultEntity().id}
              onChange={e => setContract({ ...contract, entity_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {settings.entities.map(entity => (
                <option key={entity.id} value={entity.id}>
                  {entity.name_ar} {entity.is_default ? '(الافتراضي)' : ''}
                </option>
              ))}
            </select>
            {/* Show color preview dots for selected entity */}
            {(() => {
              const sel = settings.entities.find(e => e.id === (contract.entity_id || getDefaultEntity().id));
              if (!sel) return null;
              return (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sel.primary_color }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sel.secondary_color }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sel.accent_color }} />
                  <span className="text-xs text-slate-400">ألوان الهوية ستُطبَّق على المعاينة والطباعة</span>
                </div>
              );
            })()}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('حالة العقد', 'Status', lang)}</label>
            <select 
              value={contract.status}
              onChange={e => {
                const newStatus = e.target.value;
                setContract({...contract, status: newStatus});
                if (newStatus === 'موقّع') {
                  platformBus.emit(PLATFORM_EVENTS.CONTRACT_SIGNED, {
                    contractId: contract.id,
                    contractTitle: contract.title_ar,
                    counterpartyId: contract.client_id,
                    projectId: contract.project_id,
                    amount: contract.payment_schedule.total_sar,
                    currency: 'SAR',
                  });
                }
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="مسودة">مسودة</option>
              <option value="قيد المراجعة">قيد المراجعة</option>
              <option value="معتمد">معتمد</option>
              <option value="موقّع">موقّع</option>
              <option value="نشط">نشط</option>
              <option value="مكتمل">مكتمل</option>
              <option value="منتهي">منتهي</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('العميل (الطرف الثاني)', 'Client (Party Two)', lang)}</label>
            <select 
              value={contract.client_id}
              onChange={e => setContract({...contract, client_id: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {(clients || []).map((client: any) => (
                <option key={client.id} value={client.id}>{client.name_ar}</option>
              ))}
            </select>
            {showClientWarning && (
              <p className="text-xs text-amber-600 mt-1">
                سيتم تحديث العميل تلقائياً ليتطابق مع المشروع المختار
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('تاريخ البدء', 'Start Date', lang)}</label>
            <input 
              type="date" 
              value={contract.start_date}
              onChange={e => {
                const newDate = e.target.value;
                setContract({...contract, start_date: newDate, hijri_date: toHijri(newDate)});
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">{contract.hijri_date}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('تاريخ الانتهاء', 'End Date', lang)}</label>
            <input 
              type="date" 
              value={contract.end_date || ''}
              onChange={e => setContract({...contract, end_date: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium text-slate-700">{t('الوسوم (مفصولة بفاصلة)', 'Tags (comma separated)', lang)}</label>
            <input 
              type="text" 
              dir="rtl"
              value={contract.tags?.join('، ') || ''}
              onChange={e => setContract({...contract, tags: e.target.value.split('،').map(t => t.trim()).filter(Boolean)})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
      </div>

      {(() => {
        const selectedEntity = settings.entities.find(e => e.id === (contract.entity_id || getDefaultEntity().id)) || getDefaultEntity();
        return (
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-lg font-bold text-slate-800">
                {t('بيانات الطرف الأول', 'Party One Details', lang)}
              </h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                {t('تُقرأ من إعدادات الجهة المختارة أعلاه', 'Read from selected entity settings', lang)}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-700 space-y-0" dir="rtl">
              <div className="flex items-start gap-3 mb-4">
                {selectedEntity.logo_base64 && (
                  <img src={selectedEntity.logo_base64} alt="logo" className="h-14 w-28 object-contain border border-slate-200 rounded-lg p-1 bg-white shrink-0" />
                )}
                <div>
                  <p className="text-base font-bold text-slate-800">{selectedEntity.name_ar}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    المرخصة من قبل وزارة التجارة والصناعة برقم {selectedEntity.cr_number}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm border-t border-slate-200 pt-4">
                <div className="flex gap-2">
                  <span className="text-slate-500 shrink-0">الممثل:</span>
                  <span className="font-medium">{selectedEntity.representative_name} — {selectedEntity.representative_title}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-500 shrink-0">العنوان:</span>
                  <span>{selectedEntity.city} — {selectedEntity.address}</span>
                </div>
                {(selectedEntity.po_box || selectedEntity.postal_code) && (
                  <div className="flex gap-2">
                    <span className="text-slate-500 shrink-0">ص.ب / الرمز البريدي:</span>
                    <span>{selectedEntity.po_box || '—'} / {selectedEntity.postal_code || '—'}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-slate-500 shrink-0">الهاتف:</span>
                  <span dir="ltr">{selectedEntity.phone}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-500 shrink-0">البريد الإلكتروني:</span>
                  <span dir="ltr">{selectedEntity.email}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-500 shrink-0">البنك:</span>
                  <span>{selectedEntity.bank_name} — {selectedEntity.account_holder}</span>
                </div>
                <div className="flex gap-2 col-span-2">
                  <span className="text-slate-500 shrink-0">الآيبان:</span>
                  <span dir="ltr" className="font-mono">{selectedEntity.bank_iban}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedEntity.primary_color }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedEntity.secondary_color }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedEntity.accent_color }} />
                <span className="text-xs text-slate-400">ألوان الهوية المطبّقة على المعاينة والطباعة</span>
                <a
                  href="#"
                  onClick={e => { e.preventDefault(); }}
                  className="mr-auto text-xs text-emerald-600 hover:text-emerald-700 underline"
                >
                  {t('تعديل الجهة في الإعدادات', 'Edit entity in Settings', lang)}
                </a>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export function ArticlesEditor({ contract, setContract, lang }: any) {
  const addArticle = () => {
    const newArticle: Article = {
      id: Date.now().toString(),
      order_index: contract.articles.length + 1,
      title_ar: 'بند جديد',
      body_ar: '',
      article_type: 'مخصص',
      is_locked: false,
      is_visible: true
    };
    setContract({ ...contract, articles: [...contract.articles, newArticle] });
  };

  const updateArticle = (id: string, field: keyof Article, value: any) => {
    setContract({
      ...contract,
      articles: contract.articles.map((a: Article) => a.id === id ? { ...a, [field]: value } : a)
    });
  };

  const deleteArticle = (id: string) => {
    setContract({
      ...contract,
      articles: contract.articles.filter((a: Article) => a.id !== id).map((a: Article, idx: number) => ({ ...a, order_index: idx + 1 }))
    });
  };

  const moveArticle = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === contract.articles.length - 1) return;
    
    const newArticles = [...contract.articles];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newArticles[index];
    newArticles[index] = newArticles[targetIndex];
    newArticles[targetIndex] = temp;
    
    setContract({
      ...contract,
      articles: newArticles.map((a, idx) => ({ ...a, order_index: idx + 1 }))
    });
  };

  const addBlock = (articleId: string, type: 'paragraph' | 'list' | 'page_break') => {
    const article = contract.articles.find((a: Article) => a.id === articleId);
    if (!article) return;

    let newBlock: ArticleBlock;
    const blockId = Date.now().toString();

    if (type === 'paragraph') {
      newBlock = { id: blockId, type: 'paragraph', text_ar: '' };
    } else if (type === 'list') {
      newBlock = { id: blockId, type: 'list', style: 'unordered', items: [{ id: Date.now().toString() + '1', text_ar: '' }] };
    } else {
      newBlock = { id: blockId, type: 'page_break' };
    }

    const currentBlocks = article.blocks || [];
    updateArticle(articleId, 'blocks', [...currentBlocks, newBlock]);
  };

  const updateBlock = (articleId: string, blockId: string, updates: Partial<ArticleBlock>) => {
    const article = contract.articles.find((a: Article) => a.id === articleId);
    if (!article || !article.blocks) return;

    const newBlocks = article.blocks.map((b: ArticleBlock) => b.id === blockId ? { ...b, ...updates } : b);
    updateArticle(articleId, 'blocks', newBlocks as ArticleBlock[]);
  };

  const deleteBlock = (articleId: string, blockId: string) => {
    const article = contract.articles.find((a: Article) => a.id === articleId);
    if (!article || !article.blocks) return;

    updateArticle(articleId, 'blocks', article.blocks.filter((b: ArticleBlock) => b.id !== blockId));
  };

  const moveBlock = (articleId: string, index: number, direction: 'up' | 'down') => {
    const article = contract.articles.find((a: Article) => a.id === articleId);
    if (!article || !article.blocks) return;

    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === article.blocks.length - 1) return;

    const newBlocks = [...article.blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;

    updateArticle(articleId, 'blocks', newBlocks);
  };

  const convertToBlocks = (articleId: string) => {
    const article = contract.articles.find((a: Article) => a.id === articleId);
    if (!article) return;
    
    const newBlock: ParagraphBlock = {
      id: Date.now().toString(),
      type: 'paragraph',
      text_ar: article.body_ar || ''
    };
    updateArticle(articleId, 'blocks', [newBlock]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">{t('بنود العقد', 'Contract Articles', lang)}</h2>
        <button onClick={addArticle} className="flex items-center space-x-2 space-x-reverse text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
          <Plus size={16} />
          <span>{t('إضافة بند', 'Add Article', lang)}</span>
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
                <span className="text-sm font-bold text-slate-500 w-16">البند {index + 1}</span>
                <input 
                  type="text"
                  dir="rtl"
                  value={article.title_ar}
                  onChange={e => updateArticle(article.id, 'title_ar', e.target.value)}
                  disabled={article.is_locked}
                  className="bg-transparent border-none focus:ring-0 font-bold text-slate-800 w-48 px-0 outline-none disabled:opacity-70"
                  placeholder="عنوان البند"
                />
                <select 
                  value={article.article_type}
                  onChange={e => updateArticle(article.id, 'article_type', e.target.value)}
                  disabled={article.is_locked}
                  className="text-xs bg-white border border-slate-200 rounded px-2 py-1 outline-none disabled:opacity-70"
                >
                  <option value="تمهيد">تمهيد</option>
                  <option value="موضوع">موضوع</option>
                  <option value="مدة التنفيذ">مدة التنفيذ</option>
                  <option value="القيمة والدفعات">القيمة والدفعات</option>
                  <option value="الملكية الفكرية">الملكية الفكرية</option>
                  <option value="إدارة المشروع">إدارة المشروع</option>
                  <option value="طلبات التغيير">طلبات التغيير</option>
                  <option value="إنهاء الاتفاقية">إنهاء الاتفاقية</option>
                  <option value="أحكام عامة">أحكام عامة</option>
                  <option value="نسخ الاتفاقية">نسخ الاتفاقية</option>
                  <option value="مخصص">مخصص</option>
                </select>
                {!article.is_visible && (
                  <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded font-medium">
                    مخفي في المعاينة
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button onClick={() => updateArticle(article.id, 'is_visible', !article.is_visible)} className={`p-1.5 rounded ${article.is_visible ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}>
                  <Eye size={16} />
                </button>
                <button onClick={() => updateArticle(article.id, 'is_locked', !article.is_locked)} className={`p-1.5 rounded ${article.is_locked ? 'text-amber-600 bg-amber-50' : 'text-slate-400 bg-slate-100'}`}>
                  {article.is_locked ? <Lock size={16} /> : <Unlock size={16} />}
                </button>
                <button onClick={() => deleteArticle(article.id)} className="text-slate-400 hover:text-red-500 p-1.5">
                  <Trash2 size={16} />
                </button>
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
                        <div className="w-px h-4 bg-slate-200 mx-1"></div>
                        <button onClick={() => deleteBlock(article.id, block.id)} disabled={article.is_locked} className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-50"><Trash2 size={14} /></button>
                      </div>

                      {block.type === 'paragraph' && (
                        <textarea
                          dir="rtl"
                          value={block.text_ar}
                          onChange={e => updateBlock(article.id, block.id, { text_ar: e.target.value })}
                          disabled={article.is_locked}
                          className="w-full min-h-[80px] p-2 bg-transparent border-none focus:ring-0 outline-none resize-y text-slate-700 disabled:text-slate-500"
                          placeholder="نص الفقرة..."
                        />
                      )}

                      {block.type === 'list' && (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 space-x-reverse mb-2">
                            <span className="text-xs font-medium text-slate-500">نمط القائمة:</span>
                            <select
                              value={block.style}
                              onChange={e => updateBlock(article.id, block.id, { style: e.target.value as any })}
                              disabled={article.is_locked}
                              className="text-xs border border-slate-200 rounded px-2 py-1 outline-none"
                            >
                              <option value="unordered">نقطية</option>
                              <option value="ordered">رقمية</option>
                              <option value="alpha">أبجدية</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            {block.items.map((item, iIndex) => (
                              <div key={item.id} className="flex items-start space-x-2 space-x-reverse">
                                <span className="mt-2 text-slate-400 text-xs w-4 text-center">
                                  {block.style === 'ordered' ? `${iIndex + 1}.` : block.style === 'alpha' ? `${String.fromCharCode(1575 + iIndex)}.` : '•'}
                                </span>
                                <input
                                  type="text"
                                  dir="rtl"
                                  value={item.text_ar}
                                  onChange={e => {
                                    const newItems = [...block.items];
                                    newItems[iIndex].text_ar = e.target.value;
                                    updateBlock(article.id, block.id, { items: newItems });
                                  }}
                                  disabled={article.is_locked}
                                  className="flex-1 p-1.5 border-b border-transparent hover:border-slate-200 focus:border-emerald-500 bg-transparent outline-none transition-colors"
                                  placeholder={`عنصر ${iIndex + 1}`}
                                />
                                {!article.is_locked && (
                                  <button
                                    onClick={() => {
                                      const newItems = block.items.filter((_, idx) => idx !== iIndex);
                                      updateBlock(article.id, block.id, { items: newItems });
                                    }}
                                    className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          {!article.is_locked && (
                            <button
                              onClick={() => {
                                const newItems = [...block.items, { id: Date.now().toString(), text_ar: '' }];
                                updateBlock(article.id, block.id, { items: newItems });
                              }}
                              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center space-x-1 space-x-reverse mt-2"
                            >
                              <Plus size={12} /> <span>إضافة عنصر</span>
                            </button>
                          )}
                        </div>
                      )}

                      {block.type === 'page_break' && (
                        <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 text-slate-400">
                          <FileMinus size={24} className="mb-2 opacity-50" />
                          <span className="text-sm font-medium">فاصل صفحة قبل المحتوى التالي</span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {!article.is_locked && (
                    <div className="flex items-center space-x-2 space-x-reverse pt-2 border-t border-slate-100">
                      <button onClick={() => addBlock(article.id, 'paragraph')} className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-medium transition-colors">
                        <AlignRight size={14} /> <span>إضافة فقرة</span>
                      </button>
                      <button onClick={() => addBlock(article.id, 'list')} className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-medium transition-colors">
                        <ListOrdered size={14} /> <span>إضافة قائمة</span>
                      </button>
                      <button onClick={() => addBlock(article.id, 'page_break')} className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-xs font-medium transition-colors">
                        <FileMinus size={14} /> <span>إضافة فاصل صفحة</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    dir="rtl"
                    value={article.body_ar}
                    onChange={e => updateArticle(article.id, 'body_ar', e.target.value)}
                    disabled={article.is_locked}
                    className={`w-full h-32 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-y ${article.is_locked ? 'bg-slate-100 cursor-not-allowed text-slate-400' : ''}`}
                    placeholder="نص البند..."
                  />
                  {!article.is_locked && (
                    <button onClick={() => convertToBlocks(article.id)} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md">
                      الترقية إلى كتل المحتوى (Blocks)
                    </button>
                  )}
                </div>
              )}
              {article.is_locked && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="bg-white/90 px-4 py-2 rounded-lg flex items-center space-x-2 space-x-reverse text-slate-500 shadow-sm border border-slate-100">
                    <Lock size={16} />
                    <span className="text-sm font-medium">هذا البند محمي ولا يمكن تعديله</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PaymentsEditor({ contract, setContract, lang }: any) {
  const schedule = contract.payment_schedule;

  const updateSchedule = (updates: Partial<PaymentSchedule>) => {
    setContract({
      ...contract,
      payment_schedule: { ...schedule, ...updates }
    });
  };

  const addTask = () => {
    const newTask: TaskRow = { id: Date.now().toString(), task_name_ar: 'مهمة جديدة', duration: '', cost_sar: 0, frequency: 'مرة واحدة' };
    updateTaskLogic([...schedule.tasks, newTask], schedule.installments);
  };

  const updateTask = (id: string, field: keyof TaskRow, value: any) => {
    const newTasks = schedule.tasks.map((t: TaskRow) => t.id === id ? { ...t, [field]: value } : t);
    updateTaskLogic(newTasks, schedule.installments);
  };

  const removeTask = (id: string) => {
    const newTasks = schedule.tasks.filter((t: TaskRow) => t.id !== id);
    updateTaskLogic(newTasks, schedule.installments);
  };

  const updateTaskLogic = (newTasks: TaskRow[], currentInstallments: Installment[]) => {
    const subtotal = newTasks.reduce((sum: number, task: TaskRow) => sum + Number(task.cost_sar || 0), 0);
    const vat = subtotal * (schedule.vat_rate / 100);
    const total = subtotal + vat;
    const newInstallments = currentInstallments.map((inst: Installment) => {
      const amt = total * (inst.percentage / 100);
      return { ...inst, amount_sar: amt, amount_words_ar: numberToArabicWords(amt) };
    });
    updateSchedule({ tasks: newTasks, subtotal_sar: subtotal, vat_amount: vat, total_sar: total, installments: newInstallments });
  };

  const addInstallment = () => {
    const newInst: Installment = { id: Date.now().toString(), label_ar: 'دفعة جديدة', trigger_event: 'توقيع العقد', percentage: 0, amount_sar: 0, amount_words_ar: 'صفر ريال سعودي' };
    updateSchedule({ installments: [...schedule.installments, newInst] });
  };

  const updateInstallment = (id: string, field: keyof Installment, value: any) => {
    const newInstallments = schedule.installments.map((i: Installment) => {
      if (i.id === id) {
        const updated = { ...i, [field]: value };
        if (field === 'percentage') {
          const amt = schedule.total_sar * (Number(value) / 100);
          updated.amount_sar = amt;
          updated.amount_words_ar = numberToArabicWords(amt);
        }
        return updated;
      }
      return i;
    });
    updateSchedule({ installments: newInstallments });
  };

  const removeInstallment = (id: string) => {
    updateSchedule({ installments: schedule.installments.filter((i: Installment) => i.id !== id) });
  };

  const totalPercentage = schedule.installments.reduce((sum: number, i: Installment) => sum + Number(i.percentage || 0), 0);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">{t('المهام والتكاليف', 'Tasks & Costs', lang)}</h3>
          <button onClick={addTask} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 space-x-reverse">
            <Plus size={16} /> <span>{t('إضافة مهمة', 'Add Task', lang)}</span>
          </button>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">{t('المهمة', 'Task', lang)}</th>
                <th className="px-6 py-3 font-medium">{t('المدة', 'Duration', lang)}</th>
                <th className="px-6 py-3 font-medium">{t('التكلفة (ر.س)', 'Cost (SAR)', lang)}</th>
                <th className="px-6 py-3 font-medium">{t('التكرار', 'Frequency', lang)}</th>
                <th className="px-6 py-3 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedule.tasks.map((task: TaskRow) => (
                <tr key={task.id}>
                  <td className="px-6 py-3">
                    <input type="text" dir="rtl" value={task.task_name_ar} onChange={e => updateTask(task.id, 'task_name_ar', e.target.value)} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none" />
                  </td>
                  <td className="px-6 py-3">
                    <input type="text" dir="rtl" value={task.duration} onChange={e => updateTask(task.id, 'duration', e.target.value)} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none" />
                  </td>
                  <td className="px-6 py-3">
                    <input type="number" value={task.cost_sar} onChange={e => updateTask(task.id, 'cost_sar', Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none" />
                  </td>
                  <td className="px-6 py-3">
                    <select value={task.frequency} onChange={e => updateTask(task.id, 'frequency', e.target.value)} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none">
                      <option value="مرة واحدة">مرة واحدة</option>
                      <option value="سنوي">سنوي</option>
                      <option value="شهري">شهري</option>
                    </select>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button onClick={() => removeTask(task.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr>
                <td colSpan={2} className="px-6 py-3 text-left font-medium text-slate-600">{t('الإجمالي', 'Subtotal', lang)}</td>
                <td className="px-6 py-3 font-bold text-slate-800">{schedule.subtotal_sar.toLocaleString()}</td>
                <td colSpan={2}></td>
              </tr>
              <tr>
                <td colSpan={2} className="px-6 py-3 text-left font-medium text-slate-600">{t('ضريبة القيمة المضافة (15%)', 'VAT (15%)', lang)}</td>
                <td className="px-6 py-3 font-bold text-slate-800">{schedule.vat_amount.toLocaleString()}</td>
                <td colSpan={2}></td>
              </tr>
              <tr className="bg-emerald-50">
                <td colSpan={2} className="px-6 py-3 text-left font-bold text-emerald-800">{t('الإجمالي الكلي', 'Total', lang)}</td>
                <td className="px-6 py-3 font-bold text-emerald-800">{schedule.total_sar.toLocaleString()}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center space-x-4 space-x-reverse">
            <h3 className="font-bold text-slate-800">{t('جدول الدفعات', 'Installments', lang)}</h3>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${totalPercentage === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {totalPercentage}%
            </span>
          </div>
          <button onClick={addInstallment} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 space-x-reverse">
            <Plus size={16} /> <span>{t('إضافة دفعة', 'Add Installment', lang)}</span>
          </button>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">{t('الدفعة', 'Label', lang)}</th>
                <th className="px-6 py-3 font-medium">{t('الاستحقاق', 'Trigger', lang)}</th>
                <th className="px-6 py-3 font-medium">{t('النسبة (%)', 'Percentage', lang)}</th>
                <th className="px-6 py-3 font-medium">{t('المبلغ', 'Amount', lang)}</th>
                <th className="px-6 py-3 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedule.installments.map((inst: Installment) => (
                <tr key={inst.id}>
                  <td className="px-6 py-3">
                    <input type="text" dir="rtl" value={inst.label_ar} onChange={e => updateInstallment(inst.id, 'label_ar', e.target.value)} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none" />
                  </td>
                  <td className="px-6 py-3">
                    <select value={inst.trigger_event} onChange={e => updateInstallment(inst.id, 'trigger_event', e.target.value)} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none">
                      <option value="توقيع العقد">توقيع العقد</option>
                      <option value="اعتماد المتطلبات">اعتماد المتطلبات</option>
                      <option value="الإطلاق التجريبي">الإطلاق التجريبي</option>
                      <option value="الإطلاق">الإطلاق</option>
                      <option value="مخصص">مخصص</option>
                    </select>
                  </td>
                  <td className="px-6 py-3">
                    <input type="number" value={inst.percentage} onChange={e => updateInstallment(inst.id, 'percentage', Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 outline-none" />
                  </td>
                  <td className="px-6 py-3">
                    <div className="font-medium text-slate-700">{inst.amount_sar.toLocaleString()} ر.س</div>
                    <div className="text-xs text-slate-500 mt-1">{inst.amount_words_ar}</div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button onClick={() => removeInstallment(inst.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-4">{t('البيانات البنكية', 'Bank Details', lang)}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('اسم البنك', 'Bank Name', lang)}</label>
            <input type="text" value={schedule.bank_name} onChange={e => updateSchedule({bank_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('اسم الحساب', 'Account Holder', lang)}</label>
            <input type="text" value={schedule.account_holder} onChange={e => updateSchedule({account_holder: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('رقم الآيبان', 'IBAN', lang)}</label>
            <input type="text" dir="ltr" value={schedule.bank_iban} onChange={e => updateSchedule({bank_iban: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-left" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppendicesEditor({ contract, setContract, lang }: any) {
  const addAppendix = () => {
    const newApp: Appendix = {
      id: Date.now().toString(),
      order_index: contract.appendices.length + 1,
      title_ar: 'ملحق جديد',
      body_ar: '',
      appendix_type: 'أخرى'
    };
    setContract({ ...contract, appendices: [...contract.appendices, newApp] });
  };

  const updateAppendix = (id: string, field: keyof Appendix, value: any) => {
    setContract({
      ...contract,
      appendices: contract.appendices.map((a: Appendix) => a.id === id ? { ...a, [field]: value } : a)
    });
  };

  const deleteAppendix = (id: string) => {
    setContract({
      ...contract,
      appendices: contract.appendices.filter((a: Appendix) => a.id !== id).map((a: Appendix, idx: number) => ({ ...a, order_index: idx + 1 }))
    });
  };

  const moveAppendix = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === contract.appendices.length - 1) return;
    
    const newApps = [...contract.appendices];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newApps[index];
    newApps[index] = newApps[targetIndex];
    newApps[targetIndex] = temp;
    
    setContract({
      ...contract,
      appendices: newApps.map((a, idx) => ({ ...a, order_index: idx + 1 }))
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">{t('ملاحق العقد', 'Appendices', lang)}</h2>
        <button onClick={addAppendix} className="flex items-center space-x-2 space-x-reverse text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
          <Plus size={16} />
          <span>{t('إضافة ملحق', 'Add Appendix', lang)}</span>
        </button>
      </div>

      <div className="space-y-4">
        {contract.appendices.map((app: Appendix, index: number) => (
          <div key={app.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="flex flex-col space-y-1 ml-2">
                  <button onClick={() => moveAppendix(index, 'up')} className="text-slate-400 hover:text-emerald-600"><ArrowUp size={14} /></button>
                  <button onClick={() => moveAppendix(index, 'down')} className="text-slate-400 hover:text-emerald-600"><ArrowDown size={14} /></button>
                </div>
                <span className="text-sm font-bold text-slate-500 w-16">ملحق {index + 1}</span>
                <input 
                  type="text"
                  dir="rtl"
                  value={app.title_ar}
                  onChange={e => updateAppendix(app.id, 'title_ar', e.target.value)}
                  className="bg-transparent border-none focus:ring-0 font-bold text-slate-800 w-48 px-0 outline-none"
                  placeholder="عنوان الملحق"
                />
                <select 
                  value={app.appendix_type}
                  onChange={e => updateAppendix(app.id, 'appendix_type', e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded px-2 py-1 outline-none"
                >
                  <option value="قائمة الخدمات">قائمة الخدمات</option>
                  <option value="التهيئة التقنية">التهيئة التقنية</option>
                  <option value="العرض الفني">العرض الفني</option>
                  <option value="قائمة الأسعار">قائمة الأسعار</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>
              <button onClick={() => deleteAppendix(app.id)} className="text-slate-400 hover:text-red-500 p-1.5">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="p-4">
              <textarea
                dir="rtl"
                value={app.body_ar}
                onChange={e => updateAppendix(app.id, 'body_ar', e.target.value)}
                className="w-full h-32 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
                placeholder="محتوى الملحق..."
              />
            </div>
          </div>
        ))}
        {contract.appendices.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">{t('لا توجد ملاحق مضافة', 'No appendices added', lang)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AttachmentsEditor({ contract, setContract, lang }: any) {
  const [showForm, setShowForm] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [newType, setNewType] = React.useState<'العرض الفني' | 'التصاميم' | 'وثيقة النطاق' | 'أخرى'>('أخرى');

  const addAttachment = () => {
    if (!newTitle.trim()) return;
    const newAtt: Attachment = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      file_type: 'PDF',
      attachment_type: newType,
      uploaded_at: new Date().toISOString().split('T')[0]
    };
    setContract({ ...contract, attachments: [...contract.attachments, newAtt] });
    setNewTitle('');
    setNewType('أخرى');
    setShowForm(false);
  };

  const deleteAttachment = (id: string) => {
    setContract({ ...contract, attachments: contract.attachments.filter((a: Attachment) => a.id !== id) });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">{t('المرفقات', 'Attachments', lang)}</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center space-x-2 space-x-reverse text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
          <Plus size={16} />
          <span>{t('إضافة مرفق', 'Add Attachment', lang)}</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-4 flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-slate-700">اسم المرفق</label>
            <input
              type="text"
              dir="rtl"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="مثال: العرض الفني المعتمد"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="w-48 space-y-2">
            <label className="text-sm font-medium text-slate-700">نوع المرفق</label>
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as any)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="العرض الفني">العرض الفني</option>
              <option value="التصاميم">التصاميم</option>
              <option value="وثيقة النطاق">وثيقة النطاق</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={addAttachment} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium">إضافة</button>
            <button onClick={() => setShowForm(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium">إلغاء</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-medium">{t('اسم المرفق', 'Title', lang)}</th>
              <th className="px-6 py-3 font-medium">{t('النوع', 'Type', lang)}</th>
              <th className="px-6 py-3 font-medium">{t('تاريخ الرفع', 'Uploaded At', lang)}</th>
              <th className="px-6 py-3 font-medium w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contract.attachments.map((att: Attachment) => (
              <tr key={att.id}>
                <td className="px-6 py-4 font-medium text-slate-800">{att.title}</td>
                <td className="px-6 py-4 text-slate-600">{att.attachment_type}</td>
                <td className="px-6 py-4 text-slate-500">{att.uploaded_at}</td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => deleteAttachment(att.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {contract.attachments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  {t('لا توجد مرفقات', 'No attachments', lang)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VersionsEditor({ contract, setContract, lang }: any) {
  const restoreVersion = (version: ContractVersion) => {
    if (confirm('هل أنت متأكد من استعادة هذا الإصدار؟ سيتم الكتابة فوق التعديلات الحالية.')) {
      setContract({ ...version.snapshot, versions: contract.versions });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">{t('سجل الإصدارات', 'Version History', lang)}</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-medium">{t('رقم الإصدار', 'Version', lang)}</th>
              <th className="px-6 py-3 font-medium">{t('التاريخ', 'Date', lang)}</th>
              <th className="px-6 py-3 font-medium">{t('ملخص التغيير', 'Summary', lang)}</th>
              <th className="px-6 py-3 font-medium w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contract.versions.map((v: ContractVersion) => (
              <tr key={v.version_number}>
                <td className="px-6 py-4 font-bold text-slate-800">v{v.version_number}.0</td>
                <td className="px-6 py-4 text-slate-500" dir="ltr">{new Date(v.created_at).toLocaleString('ar-SA')}</td>
                <td className="px-6 py-4 text-slate-700">{v.change_summary}</td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => restoreVersion(v)} className="text-emerald-600 hover:text-emerald-700 font-medium">
                    {t('استعادة', 'Restore', lang)}
                  </button>
                </td>
              </tr>
            ))}
            {contract.versions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  {t('سيتم إنشاء الإصدارات تلقائياً عند حفظ العقد', 'Versions are created automatically when saving the contract', lang)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContractPreview({ contract, lang, projects, clients }: any) {
  const { getDefaultEntity, getEntityById } = useSettings();
  const entity = (contract.entity_id ? getEntityById(contract.entity_id) : null) || getDefaultEntity();
  const colors = {
    primary: entity.primary_color,
    secondary: entity.secondary_color,
    accent: entity.accent_color,
  };

  const client = (clients || []).find((c: any) => c.id === contract.client_id);
  const project = projects?.find((p: any) => p.id === contract.project_id);
  const schedule = contract.payment_schedule;
  const visibleArticles = contract.articles.filter((a: Article) => a.is_visible).sort((a: Article, b: Article) => a.order_index - b.order_index);

  const [isExporting, setIsExporting] = React.useState(false);
  const [driveStatus, setDriveStatus] = React.useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [driveLink, setDriveLink] = React.useState<string | null>(null);

  React.useEffect(() => {
    initGoogleDrive();
  }, []);

  const sanitizeFilename = (name: string) =>
    name.replace(/[/\\?%*:|"<>]/g, '-').trim();

  const handleSaveToDrive = async () => {
    setDriveStatus('uploading');
    setDriveLink(null);
    try {
      if (!isConnected()) {
        await requestDriveAccess();
      }
      const blob = await generatePdfBlob('contract-preview');
      const filename = sanitizeFilename(
        `${contract.contract_number}-${contract.title_ar}.pdf`
      );
      const result = await uploadPdfToDrive(
        blob,
        filename,
        entity.name_ar,
        client?.name_ar
      );
      setDriveLink(result.webViewLink);
      setDriveStatus('success');
    } catch (err) {
      console.error(err);
      setDriveStatus('error');
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const filename = sanitizeFilename(`${contract.contract_number}-${contract.title_ar}.pdf`);
      await exportContractToPdf('contract-preview', {
        filename,
        primaryColor: colors.primary,
      });
    } catch (err) {
      console.error('PDF export failed:', err);
      alert(t('فشل تصدير PDF، حاول مرة أخرى', 'PDF export failed, please try again', lang));
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="mb-4 flex justify-end gap-3 no-print sticky top-0 z-10 bg-slate-50 py-2">
        <button
          onClick={handleSaveToDrive}
          disabled={driveStatus === 'uploading'}
          className="flex items-center space-x-2 space-x-reverse bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          <Cloud size={18} />
          <span>
            {driveStatus === 'uploading'
              ? t('جارٍ الرفع...', 'Uploading...', lang)
              : t('حفظ في Drive', 'Save to Drive', lang)}
          </span>
        </button>
        <button
          onClick={handleExportPdf}
          disabled={isExporting}
          className="flex items-center space-x-2 space-x-reverse bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          <FileDown size={18} />
          <span>
            {isExporting
              ? t('جارٍ التصدير...', 'Exporting...', lang)
              : t('تصدير PDF', 'Export PDF', lang)}
          </span>
        </button>
        <button onClick={handlePrint} className="flex items-center space-x-2 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
          <Printer size={18} />
          <span>{t('طباعة', 'Print', lang)}</span>
        </button>
      </div>

      {driveStatus === 'success' && driveLink && (
        <div className="mb-4 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 no-print">
          <CheckCircle size={16} />
          <span>{t('تم الحفظ في Google Drive', 'Saved to Google Drive', lang)}</span>
          <a
            href={driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mr-auto underline font-medium"
          >
            {t('فتح الملف', 'Open file', lang)}
          </a>
        </div>
      )}
      {driveStatus === 'error' && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2 no-print">
          <AlertCircle size={16} />
          <span>{t('فشل الرفع، حاول مرة أخرى', 'Upload failed, try again', lang)}</span>
        </div>
      )}

      <div id="contract-preview" className="bg-white shadow-xl border border-slate-200 p-12 max-w-4xl mx-auto text-slate-900 contract-pdf-ready" dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif" }}>
        <div className="flex justify-between items-start mb-8">
          <div className="text-right">
            {entity.logo_base64 ? (
              <img
                src={entity.logo_base64}
                alt="logo"
                className="h-20 max-w-[180px] object-contain"
              />
            ) : (
              <div className="h-20 w-[180px]" />
            )}
          </div>
          <div className="text-left text-sm text-slate-500 leading-6">
            <p>{entity.name_ar}</p>
            <p>س.ت: {entity.cr_number}</p>
            <p>{entity.city}</p>
          </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-6">بسم الله الرحمن الرحيم</h1>
          <h2 className="text-xl font-bold">{contract.title_ar}</h2>
          <p className="text-sm text-slate-500 mt-2">رقم العقد: {contract.contract_number}</p>
          <p className="text-sm text-slate-500">الميلادي: {contract.start_date} | الهجري: {toHijri(contract.start_date)}</p>
          {project && (
            <div className="mt-4 inline-block bg-slate-50 border border-slate-200 rounded-lg px-6 py-3 text-sm text-slate-600">
              <div className="flex items-center justify-center gap-6">
                <div><span className="text-slate-400 ml-1">المشروع:</span><span className="font-medium">{project.name_ar}</span></div>
                <div><span className="text-slate-400 ml-1">نوع المشروع:</span><span className="font-medium">{project.project_type}</span></div>
                <div><span className="text-slate-400 ml-1">القيمة:</span><span className="font-medium">{project.amount_sar.toLocaleString('ar-SA')} ر.س</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-10 leading-relaxed text-lg">
          <p className="mb-4">إنه في يوم الموافق {contract.start_date}، تم الاتفاق بين كل من:</p>
          
          <div className="mb-6 bg-slate-50 p-4 rounded border border-slate-100">
            <p className="font-bold mb-2" style={{ color: colors.primary }}>الطرف الأول: {entity.name_ar}</p>
            <div className="grid grid-cols-2 gap-2 text-base">
              <p>سجل تجاري رقم: {entity.cr_number}</p>
              <p>ويمثلها في هذا العقد: {entity.representative_name} ({entity.representative_title})</p>
              <p>العنوان: {entity.city} – {entity.address}</p>
              <p>البريد الإلكتروني: {entity.email}</p>
            </div>
          </div>

          <div className="mb-6 bg-slate-50 p-4 rounded border border-slate-100">
            <p className="font-bold mb-2" style={{ color: colors.primary }}>الطرف الثاني: {client?.name_ar}</p>
            <div className="grid grid-cols-2 gap-2 text-base">
              <p>سجل تجاري رقم: {client?.license_no}</p>
              <p>ويمثلها في هذا العقد: {client?.representative_name} ({client?.representative_title})</p>
              <p>العنوان: {client?.city} - {client?.address}</p>
              <p>البريد الإلكتروني: {client?.email}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8 text-lg">
          {visibleArticles.map((article: Article, idx: number) => (
            <div key={article.id} className="article-block">
              <h3 className="text-xl font-bold mb-3" style={{ color: colors.accent }}>البند {idx + 1}: {article.title_ar}</h3>
              {article.blocks && article.blocks.length > 0 ? (
                <div className="space-y-4">
                  {article.blocks.map((block: ArticleBlock) => {
                    if (block.type === 'paragraph') {
                      return <p key={block.id} className="whitespace-pre-wrap leading-relaxed text-justify">{block.text_ar}</p>;
                    } else if (block.type === 'list') {
                      const ListTag = block.style === 'ordered' || block.style === 'alpha' ? 'ol' : 'ul';
                      const listClass = block.style === 'ordered' ? 'list-decimal' : block.style === 'alpha' ? 'list-[lower-alpha]' : 'list-disc';
                      return (
                        <ListTag key={block.id} className={`${listClass} list-inside space-y-2 mr-4 leading-relaxed text-justify`}>
                          {block.items.map(item => (
                            <li key={item.id}>{item.text_ar}</li>
                          ))}
                        </ListTag>
                      );
                    } else if (block.type === 'page_break') {
                      return <div key={block.id} className="contract-page-break">فاصل صفحة</div>;
                    }
                    return null;
                  })}
                </div>
              ) : (
                <div className="whitespace-pre-wrap leading-relaxed text-justify">{article.body_ar || '(نص البند فارغ)'}</div>
              )}
            </div>
          ))}

          {schedule.tasks.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-3" style={{ color: colors.accent }}>البند {visibleArticles.length + 1}: جدول الدفعات والمهام</h3>
              
              <table className="w-full border-collapse border border-slate-300 mb-6 text-base">
                <thead style={{ backgroundColor: colors.primary }}>
                  <tr>
                    <th className="border border-slate-300 px-4 py-2 text-right text-white font-medium">المهمة</th>
                    <th className="border border-slate-300 px-4 py-2 text-right text-white font-medium">المدة</th>
                    <th className="border border-slate-300 px-4 py-2 text-right text-white font-medium">التكلفة (ريال)</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.tasks.map((task: TaskRow, index: number) => (
                    <tr key={task.id} style={{ backgroundColor: index % 2 === 0 ? colors.secondary : 'white' }}>
                      <td className="border border-slate-300 px-4 py-2">{task.task_name_ar}</td>
                      <td className="border border-slate-300 px-4 py-2">{task.duration}</td>
                      <td className="border border-slate-300 px-4 py-2">{task.cost_sar.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold">
                  <tr>
                    <td colSpan={2} className="border border-slate-300 px-4 py-2">الإجمالي غير شامل الضريبة</td>
                    <td className="border border-slate-300 px-4 py-2">{schedule.subtotal_sar.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="border border-slate-300 px-4 py-2">ضريبة القيمة المضافة ({schedule.vat_rate}%)</td>
                    <td className="border border-slate-300 px-4 py-2">{schedule.vat_amount.toLocaleString()}</td>
                  </tr>
                  <tr style={{ backgroundColor: colors.secondary }}>
                    <td colSpan={2} className="border border-slate-300 px-4 py-2" style={{ color: colors.accent }}>الإجمالي الكلي</td>
                    <td className="border border-slate-300 px-4 py-2" style={{ color: colors.accent }}>{schedule.total_sar.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>

              {schedule.installments.length > 0 && (
                <div className="mb-6">
                  <p className="font-bold mb-2">طريقة الدفع:</p>
                  <ul className="list-disc list-inside space-y-4 mr-4">
                    {schedule.installments.map((inst: Installment) => (
                      <li key={inst.id}>
                        <span className="font-bold">{inst.label_ar}</span>: نسبة {inst.percentage}% تستحق عند {inst.trigger_event}.
                        <div className="mt-1 text-slate-700">
                          المبلغ: {inst.amount_sar.toLocaleString()} ريال سعودي ({inst.amount_words_ar})
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-4 border border-slate-200 rounded text-base" style={{ backgroundColor: colors.secondary }}>
                <p className="font-bold mb-2">البيانات البنكية للطرف الأول:</p>
                <p>اسم البنك: {schedule.bank_name}</p>
                <p>اسم الحساب: {schedule.account_holder}</p>
                <p>رقم الآيبان: <span dir="ltr">{schedule.bank_iban}</span></p>
              </div>
            </div>
          )}

          {contract.appendices.length > 0 && (
            <div className="mt-12 pt-8 border-t-2 border-slate-800">
              <h2 className="text-2xl font-bold mb-8 text-center">الملاحق</h2>
              {contract.appendices.map((app: Appendix, idx: number) => (
                <div key={app.id} className="mb-8">
                  <h3 className="text-xl font-bold mb-3" style={{ color: colors.accent }}>الملحق {idx + 1}: {app.title_ar}</h3>
                  <div className="whitespace-pre-wrap leading-relaxed text-justify">{app.body_ar || '(نص الملحق فارغ)'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-24 grid grid-cols-2 gap-12 text-center text-lg signature-block">
          <div>
            <p className="font-bold mb-8">الطرف الأول</p>
            <p>الاسم: {entity.representative_name}</p>
            <p className="mt-4">التوقيع: ___________________</p>
          </div>
          <div>
            <p className="font-bold mb-8">الطرف الثاني</p>
            <p>الاسم: {client?.representative_name}</p>
            <p className="mt-4">التوقيع: ___________________</p>
          </div>
        </div>
      </div>
    </div>
  );
}
