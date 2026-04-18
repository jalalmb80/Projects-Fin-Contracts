import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { Briefcase, X, CheckCircle, AlertCircle, FolderOpen } from 'lucide-react';
import { db } from '../../../core/firebase';
import { t } from '../context/LanguageContext';
import { Contract } from '../types';

// ── Finance project types (mirrored from finance/types.ts to avoid cross-module import) ─────
const FINANCE_PROJECT_TYPES = [
  'تطوير منصة',
  'تطوير تطبيق',
  'موقع إلكتروني',
  'اشتراك سنوي',
  'تهيئة وتشغيل',
  'استشارات',
  'أخرى',
] as const;

// Contract type → Finance project type best-guess mapping
function guessProjectType(contractType: string): string {
  if (contractType.includes('برمج') || contractType.includes('SaaS') || contractType.includes('اشتراك'))
    return 'تطوير منصة';
  if (contractType.includes('تطبيق')) return 'تطوير تطبيق';
  if (contractType.includes('محتوى') || contractType.includes('إعلام')) return 'موقع إلكتروني';
  if (contractType.includes('مختلط')) return 'تهيئة وتشغيل';
  return 'أخرى';
}

interface Props {
  contract: Contract;
  clientName: string;      // resolved Arabic name of the contract's client
  clientId: string;        // shared_clients id (= Finance counterparty id)
  lang: string;
  onClose: () => void;
  onCreated: (projectId: string) => void;
}

export default function CreateFinanceProjectModal({
  contract, clientName, clientId, lang, onClose, onCreated,
}: Props) {
  const isRTL = lang === 'ar';

  // Pre-fill from contract data
  const [name, setName]             = useState(contract.title_ar);
  const [projectType, setProjectType] = useState(guessProjectType(contract.type));
  const [contractValue, setContractValue] = useState(contract.payment_schedule.total_sar);
  const [startDate, setStartDate]   = useState(contract.start_date);
  const [endDate, setEndDate]       = useState(contract.end_date ?? '');
  const [description, setDescription] = useState(
    `مشروع منشأ من عقد ${contract.contract_number} — ${clientName}`
  );
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [done, setDone]       = useState(false);
  const [createdId, setCreatedId] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) { setError(t('يرجى إدخال اسم المشروع', 'Project name is required', lang)); return; }
    if (!clientId) { setError(t('لم يتم العثور على العميل في سجل العملاء', 'Client not found in Finance', lang)); return; }

    setSaving(true);
    setError(null);
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const project = {
        id,
        name: name.trim(),
        description: description.trim(),
        clientId,
        contractType: 'FIXED',   // default; user can change in Finance later
        contractValue: Number(contractValue) || 0,
        baseCurrency: 'SAR',
        startDate,
        endDate: endDate || undefined,
        status: 'Planned',        // Finance ProjectStatus.Planned
        wbs: [],
        milestones: [],
        // Link back to CMS contract so Finance can trace origin
        cmsContractId: contract.id,
        cmsContractNumber: contract.contract_number,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(db, 'projects', id), project);
      setCreatedId(id);
      setDone(true);
      onCreated(id);
    } catch (e: any) {
      console.error('[CreateFinanceProjectModal]', e);
      setError(e?.message ?? t('حدث خطأ غير متوقع', 'An unexpected error occurred', lang));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg mx-auto overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-l from-emerald-600 to-teal-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FolderOpen size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-none">{t('إنشاء مشروع في المالية', 'Create Finance Project', lang)}</h2>
              <p className="text-emerald-100 text-xs mt-0.5">{t('عقد', 'Contract', lang)} {contract.contract_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {done ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{t('تم إنشاء المشروع بنجاح', 'Project created successfully', lang)}</h3>
            <p className="text-slate-500 text-sm mb-6">
              {t('يمكنك متابعته من وحدة المالية في قائمة المشاريع', 'You can follow up on it from the Finance module in the projects list', lang)}
            </p>
            <button onClick={onClose} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium">
              {t('تم', 'Done', lang)}
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Client info read-only pill */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
              <Briefcase size={14} className="text-slate-400 shrink-0" />
              <span className="text-xs text-slate-500">{t('العميل', 'Client', lang)}:</span>
              <span className="text-sm font-medium text-slate-700">{clientName || t('غير محدد', 'Not set', lang)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Project name */}
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium text-slate-700">{t('اسم المشروع', 'Project name', lang)}</label>
                <input
                  type="text" dir="rtl" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Project type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">{t('نوع المشروع', 'Project type', lang)}</label>
                <select
                  value={projectType} onChange={e => setProjectType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {FINANCE_PROJECT_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                </select>
              </div>

              {/* Contract value */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">{t('قيمة العقد (ر.س)', 'Contract value (SAR)', lang)}</label>
                <input
                  type="number" value={contractValue} onChange={e => setContractValue(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Start date */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">{t('تاريخ البدء', 'Start date', lang)}</label>
                <input
                  type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* End date */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">{t('تاريخ الانتهاء (اختياري)', 'End date (optional)', lang)}</label>
                <input
                  type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Description */}
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium text-slate-700">{t('الوصف', 'Description', lang)}</label>
                <textarea
                  dir="rtl" value={description} onChange={e => setDescription(e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>

            <p className="text-xs text-slate-400">
              {t(
                'سيتم إنشاء المشروع بحالة “مخطط” ويمكن تعديله وإضافة المراحل من وحدة المالية',
                'The project will be created with “Planned” status. You can edit it and add milestones from Finance.',
                lang
              )}
            </p>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium">
                {t('تخطّي', 'Skip', lang)}
              </button>
              <button
                onClick={handleCreate} disabled={saving || !name.trim()}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
              >
                {saving ? t('جارٍ الإنشاء...', 'Creating...', lang) : t('إنشاء المشروع', 'Create project', lang)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
