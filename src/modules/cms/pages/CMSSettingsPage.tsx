import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, ArrowLeft, ArrowRight, Plus, Trash2, GripVertical, Trophy, Edit2, Check, X } from 'lucide-react';
import { useLang, t } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { ContractStatusConfig } from '../types';

// ── Inline editable row for a contract type ───────────────────────────────────
function TypeRow({ value, onSave, onDelete }: { value: string; onSave: (v: string) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const commit = () => { if (draft.trim()) { onSave(draft.trim()); setEditing(false); } };
  return editing ? (
    <div className="flex items-center gap-2">
      <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="flex-1 px-3 py-1.5 border border-emerald-400 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500" dir="rtl" />
      <button onClick={commit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"><Check size={15} /></button>
      <button onClick={() => setEditing(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded"><X size={15} /></button>
    </div>
  ) : (
    <div className="flex items-center gap-2 group">
      <GripVertical size={14} className="text-slate-300 shrink-0" />
      <span className="flex-1 text-sm text-slate-700">{value}</span>
      <button onClick={() => { setDraft(value); setEditing(true); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-indigo-600 rounded transition-opacity"><Edit2 size={14} /></button>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 rounded transition-opacity"><Trash2 size={14} /></button>
    </div>
  );
}

// ── Inline editable row for a contract status ─────────────────────────────────
function StatusRow({ status, onSave, onDelete, onToggleWin }: {
  status: ContractStatusConfig;
  onSave: (v: ContractStatusConfig) => void;
  onDelete: () => void;
  onToggleWin: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(status.label);
  const commit = () => { if (draft.trim()) { onSave({ ...status, label: draft.trim() }); setEditing(false); } };
  return (
    <div className={`flex items-center gap-2 group rounded-lg px-2 py-1.5 ${status.is_win ? 'bg-emerald-50/60' : ''}`}>
      <GripVertical size={14} className="text-slate-300 shrink-0" />
      {editing ? (
        <>
          <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            className="flex-1 px-3 py-1 border border-emerald-400 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500" dir="rtl" />
          <button onClick={commit} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded"><Check size={15} /></button>
          <button onClick={() => setEditing(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded"><X size={15} /></button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm text-slate-700">{status.label}</span>
          {/* Win badge */}
          <button
            onClick={onToggleWin}
            title={status.is_win ? 'إلغاء تصنيف الفوز' : 'تصنيف كحالة فوز'}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
              status.is_win
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'
            }`}
          >
            <Trophy size={11} />
            {status.is_win ? 'فوز' : 'فوز؟'}
          </button>
          <button onClick={() => { setDraft(status.label); setEditing(true); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-indigo-600 rounded transition-opacity"><Edit2 size={14} /></button>
          <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 rounded transition-opacity"><Trash2 size={14} /></button>
        </>
      )}
    </div>
  );
}

export default function CMSSettingsPage() {
  const { lang } = useLang();
  const isRTL = lang === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const { contractStatuses, contractTypes, updateContractStatuses, updateContractTypes } = useSettings();

  // ── Local state (optimistic UI) ──────────────────────────────────────────────
  const [statuses, setStatuses] = useState<ContractStatusConfig[]>(contractStatuses);
  const [types,    setTypes]    = useState<string[]>(contractTypes);
  const [newStatus, setNewStatus] = useState('');
  const [newType,   setNewType]   = useState('');
  const [saving,   setSaving]   = useState<'statuses' | 'types' | null>(null);
  const [saved,    setSaved]    = useState<'statuses' | 'types' | null>(null);

  // Keep local state in sync when context loads from Firestore
  React.useEffect(() => { setStatuses(contractStatuses); }, [contractStatuses]);
  React.useEffect(() => { setTypes(contractTypes); }, [contractTypes]);

  const flash = (which: 'statuses' | 'types') => {
    setSaved(which); setTimeout(() => setSaved(null), 2000);
  };

  // ── Statuses handlers ────────────────────────────────────────────────────────
  const addStatus = async () => {
    if (!newStatus.trim()) return;
    const next = [...statuses, { id: crypto.randomUUID(), label: newStatus.trim(), is_win: false }];
    setStatuses(next); setNewStatus('');
    setSaving('statuses');
    await updateContractStatuses(next).finally(() => { setSaving(null); flash('statuses'); });
  };

  const saveStatus = async (updated: ContractStatusConfig) => {
    const next = statuses.map(s => s.id === updated.id ? updated : s);
    setStatuses(next);
    setSaving('statuses');
    await updateContractStatuses(next).finally(() => { setSaving(null); flash('statuses'); });
  };

  const deleteStatus = async (id: string) => {
    const next = statuses.filter(s => s.id !== id);
    setStatuses(next);
    setSaving('statuses');
    await updateContractStatuses(next).finally(() => { setSaving(null); flash('statuses'); });
  };

  const toggleWin = async (id: string) => {
    const next = statuses.map(s => s.id === id ? { ...s, is_win: !s.is_win } : s);
    setStatuses(next);
    setSaving('statuses');
    await updateContractStatuses(next).finally(() => { setSaving(null); flash('statuses'); });
  };

  // ── Types handlers ───────────────────────────────────────────────────────────
  const addType = async () => {
    if (!newType.trim() || types.includes(newType.trim())) return;
    const next = [...types, newType.trim()];
    setTypes(next); setNewType('');
    setSaving('types');
    await updateContractTypes(next).finally(() => { setSaving(null); flash('types'); });
  };

  const saveType = async (index: number, value: string) => {
    const next = types.map((v, i) => i === index ? value : v);
    setTypes(next);
    setSaving('types');
    await updateContractTypes(next).finally(() => { setSaving(null); flash('types'); });
  };

  const deleteType = async (index: number) => {
    const next = types.filter((_, i) => i !== index);
    setTypes(next);
    setSaving('types');
    await updateContractTypes(next).finally(() => { setSaving(null); flash('types'); });
  };

  const SectionHeader = ({ title, which }: { title: string; which: 'statuses' | 'types' }) => (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      <span className={`text-xs transition-all ${
        saving === which ? 'text-slate-400' : saved === which ? 'text-emerald-600 font-medium' : 'opacity-0'
      }`}>
        {saving === which ? t('جارٍ الحفظ...', 'Saving...', lang) : '✓ ' + t('تم الحفظ', 'Saved', lang)}
      </span>
    </div>
  );

  return (
    <div className="p-8 space-y-6 max-w-3xl" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-slate-800">{t('إعدادات العقود', 'Contract Settings', lang)}</h1>

      {/* ── Platform Settings banner ── */}
      <Link to="/settings"
        className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-4 hover:bg-emerald-100 transition-colors group">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0"><Globe size={18} className="text-white" /></div>
          <div>
            <p className="font-semibold text-emerald-800">{t('إعدادات المنصة', 'Platform Settings', lang)}</p>
            <p className="text-xs text-emerald-600 mt-0.5">{t('كيانات، شعار، ألوان، بيانات بنكية — مشتركة مع وحدة المالية', 'Entities, logo, colors, bank details — shared with Finance', lang)}</p>
          </div>
        </div>
        <ArrowIcon size={20} className="text-emerald-500 group-hover:translate-x-1 transition-transform shrink-0" />
      </Link>

      {/* ── Contract Statuses ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <SectionHeader title={t('حالات العقد', 'Contract Statuses', lang)} which="statuses" />

        <p className="text-xs text-slate-500 mb-4">
          {t(
            'حدد حالات عقودك وصنّف بعضها كحالات فوز — تُستخدم في لوحة التحكم والتقارير',
            'Define your contract statuses and mark some as \u201cwin\u201d \u2014 used in dashboards and reports',
            lang
          )}
        </p>

        {/* Win legend */}
        <div className="flex items-center gap-2 mb-4 px-2 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
          <Trophy size={14} className="text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-700">
            {t(
              'حالات الفوز الحالية: ',
              'Current win statuses: ',
              lang
            )}
            <strong>{statuses.filter(s => s.is_win).map(s => s.label).join(' ، ') || t('لا يوجد', 'none', lang)}</strong>
          </p>
        </div>

        <div className="space-y-1 mb-4">
          {statuses.map(s => (
            <StatusRow
              key={s.id}
              status={s}
              onSave={saveStatus}
              onDelete={() => deleteStatus(s.id)}
              onToggleWin={() => toggleWin(s.id)}
            />
          ))}
        </div>

        {/* Add new status */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <input
            value={newStatus}
            onChange={e => setNewStatus(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addStatus()}
            placeholder={t('حالة جديدة...', 'New status...', lang)}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-400"
            dir="rtl"
          />
          <button onClick={addStatus} disabled={!newStatus.trim()}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium">
            <Plus size={15} /> {t('إضافة', 'Add', lang)}
          </button>
        </div>
      </div>

      {/* ── Contract Types ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <SectionHeader title={t('أنواع العقود', 'Contract Types', lang)} which="types" />

        <p className="text-xs text-slate-500 mb-4">
          {t(
            'تُظهر هذه الأنواع في قائمة اختيار نوع العقد عند إنشاء أو تعديل عقد',
            'These types appear in the contract type dropdown when creating or editing a contract',
            lang
          )}
        </p>

        <div className="space-y-1 mb-4">
          {types.map((type, index) => (
            <TypeRow
              key={index}
              value={type}
              onSave={value => saveType(index, value)}
              onDelete={() => deleteType(index)}
            />
          ))}
        </div>

        {/* Add new type */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <input
            value={newType}
            onChange={e => setNewType(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addType()}
            placeholder={t('نوع جديد...', 'New type...', lang)}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-400"
            dir="rtl"
          />
          <button onClick={addType} disabled={!newType.trim()}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium">
            <Plus size={15} /> {t('إضافة', 'Add', lang)}
          </button>
        </div>
      </div>

      {/* ── Info box ── */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-2 text-sm text-slate-600">
        <p className="font-semibold text-slate-700">{t('ملاحظات', 'Notes', lang)}</p>
        <ul className="space-y-1.5">
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-1.5 shrink-0" /><span>{t('تُحفظ التغييرات فورياً في Firestore وتنعكس على جميع المستخدمين فورياً', 'Changes are saved instantly to Firestore and reflect for all users immediately', lang)}</span></li>
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-1.5 shrink-0" /><span>{t('حذف حالة لا يحذف العقود التي تستخدمها بالفعل', 'Deleting a status does not affect contracts already using it', lang)}</span></li>
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-1.5 shrink-0" /><span>{t('تستخدم حالات الفوز في إحصائيات لوحة التحكم لحساب نسبة النجاح', 'Win statuses are used in dashboard KPIs to calculate success rate', lang)}</span></li>
        </ul>
      </div>
    </div>
  );
}
