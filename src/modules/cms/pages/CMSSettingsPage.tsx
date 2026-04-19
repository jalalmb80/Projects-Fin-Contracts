import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, ArrowLeft, ArrowRight, Plus, Trash2, GripVertical, Trophy, ThumbsDown, Edit2, Check, X, GitBranch } from 'lucide-react';
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
function StatusRow({ status, onSave, onDelete, onToggleWin, onToggleLose }: {
  status: ContractStatusConfig;
  onSave: (v: ContractStatusConfig) => void;
  onDelete: () => void;
  onToggleWin: () => void;
  onToggleLose: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(status.label);
  const commit = () => { if (draft.trim()) { onSave({ ...status, label: draft.trim() }); setEditing(false); } };
  const rowBg = status.is_win ? 'bg-emerald-50/60' : status.is_lose ? 'bg-red-50/60' : '';
  return (
    <div className={`flex items-center gap-2 group rounded-lg px-2 py-1.5 ${rowBg}`}>
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
          <button onClick={onToggleWin} title={status.is_win ? 'إلغاء تصنيف الفوز' : 'تصنيف كحالة فوز'}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
              status.is_win
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'
            }`}>
            <Trophy size={11} />{status.is_win ? 'فوز' : 'فوز؟'}
          </button>
          <button onClick={onToggleLose} title={status.is_lose ? 'إلغاء تصنيف الخسارة' : 'تصنيف كحالة خسارة'}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
              status.is_lose
                ? 'bg-red-100 text-red-700 border border-red-300'
                : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-red-50 hover:text-red-600'
            }`}>
            <ThumbsDown size={11} />{status.is_lose ? 'خسارة' : 'خسارة؟'}
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
  const {
    contractStatuses, contractTypes, workflowRoles,
    updateContractStatuses, updateContractTypes, updateWorkflowRoles,
  } = useSettings();

  // ── Local state (optimistic UI) ──────────────────────────────────────────────
  const [statuses, setStatuses] = useState<ContractStatusConfig[]>(contractStatuses);
  const [types,    setTypes]    = useState<string[]>(contractTypes);
  const [roles,    setRoles]    = useState<string[]>(workflowRoles);

  const [newStatus, setNewStatus] = useState('');
  const [newType,   setNewType]   = useState('');
  const [newRole,   setNewRole]   = useState('');

  const [saving,   setSaving]   = useState<'statuses' | 'types' | 'roles' | null>(null);
  const [saved,    setSaved]    = useState<'statuses' | 'types' | 'roles' | null>(null);

  React.useEffect(() => { setStatuses(contractStatuses); }, [contractStatuses]);
  React.useEffect(() => { setTypes(contractTypes); }, [contractTypes]);
  React.useEffect(() => { setRoles(workflowRoles); }, [workflowRoles]);

  const flash = (which: 'statuses' | 'types' | 'roles') => {
    setSaved(which); setTimeout(() => setSaved(null), 2000);
  };

  const persist = async (next: ContractStatusConfig[]) => {
    setStatuses(next);
    setSaving('statuses');
    await updateContractStatuses(next).finally(() => { setSaving(null); flash('statuses'); });
  };

  // ── Statuses handlers ────────────────────────────────────────────────────────
  const addStatus = async () => {
    if (!newStatus.trim()) return;
    await persist([...statuses, { id: crypto.randomUUID(), label: newStatus.trim(), is_win: false, is_lose: false }]);
    setNewStatus('');
  };
  const saveStatus = (updated: ContractStatusConfig) =>
    persist(statuses.map(s => s.id === updated.id ? updated : s));
  const deleteStatus = (id: string) =>
    persist(statuses.filter(s => s.id !== id));
  const toggleWin = (id: string) =>
    persist(statuses.map(s => s.id === id ? { ...s, is_win: !s.is_win, is_lose: s.is_win ? s.is_lose : false } : s));
  const toggleLose = (id: string) =>
    persist(statuses.map(s => s.id === id ? { ...s, is_lose: !s.is_lose, is_win: s.is_lose ? s.is_win : false } : s));

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

  // ── Workflow roles handlers ──────────────────────────────────────────────────
  const addRole = async () => {
    if (!newRole.trim() || roles.includes(newRole.trim())) return;
    const next = [...roles, newRole.trim()];
    setRoles(next); setNewRole('');
    setSaving('roles');
    await updateWorkflowRoles(next).finally(() => { setSaving(null); flash('roles'); });
  };
  const saveRole = async (index: number, value: string) => {
    const next = roles.map((v, i) => i === index ? value : v);
    setRoles(next);
    setSaving('roles');
    await updateWorkflowRoles(next).finally(() => { setSaving(null); flash('roles'); });
  };
  const deleteRole = async (index: number) => {
    const next = roles.filter((_, i) => i !== index);
    setRoles(next);
    setSaving('roles');
    await updateWorkflowRoles(next).finally(() => { setSaving(null); flash('roles'); });
  };

  const SectionHeader = ({ title, which }: { title: string; which: 'statuses' | 'types' | 'roles' }) => (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      <span className={`text-xs transition-all ${
        saving === which ? 'text-slate-400' : saved === which ? 'text-emerald-600 font-medium' : 'opacity-0'
      }`}>
        {saving === which ? t('جارٍ الحفظ...', 'Saving...', lang) : '✓ ' + t('تم الحفظ', 'Saved', lang)}
      </span>
    </div>
  );

  const winList  = statuses.filter(s => s.is_win).map(s => s.label);
  const loseList = statuses.filter(s => s.is_lose).map(s => s.label);

  return (
    <div className="p-8 space-y-6 max-w-3xl" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-slate-800">{t('إعدادات العقود', 'Contract Settings', lang)}</h1>

      {/* Platform Settings banner */}
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
          {t('حدد حالات عقودك وصنّف كلاً منها إما فوزاً أو خسارةً', 'Define your contract statuses and mark each as win or lose', lang)}
        </p>
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
            <Trophy size={13} className="text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-700">{t('حالات الفوز: ', 'Win statuses: ', lang)}<strong>{winList.join(' ، ') || t('لا يوجد', 'none', lang)}</strong></p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
            <ThumbsDown size={13} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-700">{t('حالات الخسارة: ', 'Lose statuses: ', lang)}<strong>{loseList.join(' ، ') || t('لا يوجد', 'none', lang)}</strong></p>
          </div>
        </div>
        <div className="space-y-1 mb-4">
          {statuses.map(s => (
            <StatusRow key={s.id} status={s} onSave={saveStatus} onDelete={() => deleteStatus(s.id)} onToggleWin={() => toggleWin(s.id)} onToggleLose={() => toggleLose(s.id)} />
          ))}
        </div>
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <input value={newStatus} onChange={e => setNewStatus(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStatus()}
            placeholder={t('حالة جديدة...', 'New status...', lang)}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-400" dir="rtl" />
          <button onClick={addStatus} disabled={!newStatus.trim()} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium">
            <Plus size={15} /> {t('إضافة', 'Add', lang)}
          </button>
        </div>
      </div>

      {/* ── Contract Types ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <SectionHeader title={t('أنواع العقود', 'Contract Types', lang)} which="types" />
        <p className="text-xs text-slate-500 mb-4">
          {t('تُظهر هذه الأنواع في قائمة اختيار نوع العقد', 'These types appear in the contract type dropdown', lang)}
        </p>
        <div className="space-y-1 mb-4">
          {types.map((type, index) => (
            <TypeRow key={index} value={type} onSave={value => saveType(index, value)} onDelete={() => deleteType(index)} />
          ))}
        </div>
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <input value={newType} onChange={e => setNewType(e.target.value)} onKeyDown={e => e.key === 'Enter' && addType()}
            placeholder={t('نوع جديد...', 'New type...', lang)}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-400" dir="rtl" />
          <button onClick={addType} disabled={!newType.trim()} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium">
            <Plus size={15} /> {t('إضافة', 'Add', lang)}
          </button>
        </div>
      </div>

      {/* ── Workflow Roles ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <SectionHeader title={t('أدوار سير العمل', 'Workflow Roles', lang)} which="roles" />
        <p className="text-xs text-slate-500 mb-4">
          {t(
            'هذه الأدوار تظهر في قائمة اختيار المسؤول عند تغيير حالة العقد أو إضافة ملاحظة. اختيار "أخرى" يتيح إدخال دور حر.',
            'These roles appear in the assignee dropdown when changing contract status or adding a note. Selecting "أخرى" allows free-text entry.',
            lang,
          )}
        </p>
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg mb-4">
          <GitBranch size={13} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">
            {t('الأدوار المحددة: ', 'Configured roles: ', lang)}
            <strong>{roles.join(' ، ') || t('لا يوجد', 'none', lang)}</strong>
          </p>
        </div>
        <div className="space-y-1 mb-4">
          {roles.map((role, index) => (
            <TypeRow key={index} value={role} onSave={value => saveRole(index, value)} onDelete={() => deleteRole(index)} />
          ))}
        </div>
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <input value={newRole} onChange={e => setNewRole(e.target.value)} onKeyDown={e => e.key === 'Enter' && addRole()}
            placeholder={t('دور جديد... (مثال: فريق المالية)', 'New role... (e.g. Finance Team)', lang)}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-400" dir="rtl" />
          <button onClick={addRole} disabled={!newRole.trim()} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium">
            <Plus size={15} /> {t('إضافة', 'Add', lang)}
          </button>
        </div>
      </div>

      {/* ── Info box ── */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-2 text-sm text-slate-600">
        <p className="font-semibold text-slate-700">{t('ملاحظات', 'Notes', lang)}</p>
        <ul className="space-y-1.5">
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-1.5 shrink-0" /><span>{t('تُحفظ التغييرات فورياً وتنعكس على جميع المستخدمين فوراً', 'Changes save instantly and reflect for all users immediately', lang)}</span></li>
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-1.5 shrink-0" /><span>{t('حذف حالة لا يحذف العقود التي تستخدمها بالفعل', 'Deleting a status does not affect contracts already using it', lang)}</span></li>
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" /><span>{t('حالات الفوز تُحسب في نسبة النجاح بلوحة التحكم', 'Win statuses count toward the success rate in dashboards', lang)}</span></li>
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0" /><span>{t('حالات الخسارة تُحسب في نسبة العقود الخاسرة بلوحة التحكم', 'Lose statuses count toward the lost contracts rate in dashboards', lang)}</span></li>
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 shrink-0" /><span>{t('أدوار سير العمل تُستخدم لتحديد المسؤول عند كل تغيير في حالة العقد', 'Workflow roles are used to assign responsibility at each contract status change', lang)}</span></li>
        </ul>
      </div>
    </div>
  );
}
