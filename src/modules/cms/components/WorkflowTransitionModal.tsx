/**
 * WorkflowTransitionModal
 *
 * Shown when the user changes a contract's status (from either ContractEditor
 * or ContractsList). Collects assignee (role + name) and optional note before
 * persisting the status change.
 *
 * Pure UI — no Firestore calls. Caller receives the completed WorkflowEvent
 * via onConfirm and handles persistence.
 */
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, UserCheck, AlertCircle } from 'lucide-react';
import { WorkflowEvent, WorkflowAssignee } from '../types';
import { useLang, t } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { usePlatform } from '../../../core/context/PlatformContext';

interface Props {
  contractId: string;
  fromStatus: string;
  toStatus: string;
  onConfirm: (event: WorkflowEvent) => Promise<void>;
  onCancel: () => void;
}

export default function WorkflowTransitionModal({
  contractId,
  fromStatus,
  toStatus,
  onConfirm,
  onCancel,
}: Props) {
  const { lang } = useLang();
  const { workflowRoles, contractStatuses } = useSettings();
  const { user } = usePlatform();

  const [role, setRole] = useState(workflowRoles[0] ?? '');
  const [customRole, setCustomRole] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const isCustomRole = role === 'أخرى';
  const effectiveRole = isCustomRole ? customRole.trim() : role;

  useEffect(() => { nameRef.current?.focus(); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onCancel]);

  const isWin = contractStatuses.find(s => s.label === toStatus)?.is_win ?? false;

  const handleConfirm = async () => {
    if (!name.trim()) { setNameError(true); nameRef.current?.focus(); return; }
    setNameError(false);
    setSaving(true);

    const assignee: WorkflowAssignee = {
      role: effectiveRole || (workflowRoles[0] ?? ''),
      name: name.trim(),
    };

    const actorEmail = user?.email ?? '';
    const actorName  = user?.displayName || actorEmail.split('@')[0] || 'مستخدم';

    const event: WorkflowEvent = {
      id: crypto.randomUUID(),
      type: 'transition',
      from_status: fromStatus,
      to_status: toStatus,
      assignee,
      note: note.trim(),
      actor_name: actorName,
      actor_email: actorEmail,
      created_at: new Date().toISOString(),
    };

    try {
      await onConfirm(event);
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (label: string, highlight?: boolean) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      highlight ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300' : 'bg-slate-100 text-slate-700'
    }`}>
      {label}{highlight && isWin ? ' 🏆' : ''}
    </span>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4" dir="rtl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <UserCheck size={18} className="text-amber-600" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              {t('تغيير حالة العقد', 'Change Contract Status', lang)}
            </h2>
          </div>
          <button onClick={onCancel} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Status transition display */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <p className="text-xs text-slate-500 mb-2">{t('التغيير', 'Transition', lang)}</p>
          <div className="flex items-center gap-3">
            {statusBadge(fromStatus)}
            <ArrowLeft size={16} className="text-slate-400 shrink-0" />
            {statusBadge(toStatus, true)}
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-5">

          {/* Assignee — role + name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              {t('المسؤول عن الخطوة التالية', 'Responsible for next step', lang)}
              <span className="text-red-500 mr-1">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Role */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">{t('الدور', 'Role', lang)}</label>
                {isCustomRole ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text" dir="rtl"
                      value={customRole}
                      onChange={e => setCustomRole(e.target.value)}
                      placeholder={t('اكتب الدور...', 'Type role...', lang)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                    />
                    <button
                      onClick={() => { setRole(workflowRoles[0] ?? ''); setCustomRole(''); }}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                  >
                    {workflowRoles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  {t('الاسم', 'Name', lang)}
                  <span className="text-red-500 mr-1">*</span>
                </label>
                <input
                  ref={nameRef}
                  type="text" dir="rtl"
                  value={name}
                  onChange={e => { setName(e.target.value); if (e.target.value.trim()) setNameError(false); }}
                  placeholder={t('مثال: محمد الأحمد', 'e.g. Mohammed Al-Ahmad', lang)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 ${
                    nameError
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-slate-300 focus:ring-amber-400 focus:border-amber-400'
                  }`}
                />
              </div>
            </div>

            {nameError && (
              <div className="flex items-center gap-1.5 mt-2 text-red-600 text-xs">
                <AlertCircle size={13} />
                <span>{t('اسم المسؤول مطلوب', 'Responsible person name is required', lang)}</span>
              </div>
            )}
          </div>

          {/* Note (optional) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              {t('ملاحظة', 'Note', lang)}
              <span className="text-xs font-normal text-slate-400 mr-2">({t('اختياري', 'optional', lang)})</span>
            </label>
            <textarea
              dir="rtl"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder={t(
                'مثال: تم إرسال العقد للمراجعة القانونية، وجارٍ انتظار الرد...',
                'e.g. Sent to legal review, awaiting response...',
                lang,
              )}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-start gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <UserCheck size={16} />
            )}
            {saving
              ? t('جارٍ...', 'Saving...', lang)
              : t('تأكيد التغيير', 'Confirm Change', lang)}
          </button>
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl text-sm font-medium transition-colors"
          >
            {t('إلغاء', 'Cancel', lang)}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
