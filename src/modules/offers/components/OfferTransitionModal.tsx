/**
 * OfferTransitionModal
 *
 * Opens when the user clicks a transition button in WorkflowPanel.
 * Receives fromStatus + toStatus — the status change is already decided;
 * this modal collects the responsible person (role + name) and an optional reason.
 *
 * Produces a complete WorkflowLogEntry { type: 'transition', assignee, ... }.
 * Pure UI — no Firestore calls; caller handles persistence.
 *
 * Mirrors CMS WorkflowTransitionModal.tsx in structure.
 */
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { WorkflowLogEntry, WorkflowAssignee, OfferStatus, STATUS_LABELS } from '../types';
import { useOffersSettings } from '../context/OffersSettingsContext';
import { usePlatform } from '../../../core/context/PlatformContext';
import { REASON_REQUIRED } from '../utils/stateMachine';

interface Props {
  fromStatus: OfferStatus;
  toStatus:   OfferStatus;
  onConfirm:  (entry: WorkflowLogEntry) => Promise<void>;
  onCancel:   () => void;
}

export default function OfferTransitionModal({
  fromStatus, toStatus, onConfirm, onCancel,
}: Props) {
  const { user }                   = usePlatform();
  const { offerWorkflowRoles }     = useOffersSettings();

  const [role,        setRole]        = useState(offerWorkflowRoles[0] ?? 'Offer Manager');
  const [customRole,  setCustomRole]  = useState('');
  const [name,        setName]        = useState('');
  const [reason,      setReason]      = useState('');
  const [saving,      setSaving]      = useState(false);
  const [nameError,   setNameError]   = useState(false);
  const [reasonError, setReasonError] = useState(false);

  const nameRef   = useRef<HTMLInputElement>(null);
  const isCustom  = role === 'Other';
  const effectiveRole = isCustom ? customRole.trim() : role;
  const reasonRequired = REASON_REQUIRED.includes(toStatus);

  const isWin  = toStatus === 'won' || toStatus === 'approved';

  useEffect(() => { nameRef.current?.focus(); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onCancel]);

  const handleConfirm = async () => {
    let hasError = false;
    if (!name.trim())                          { setNameError(true);   hasError = true; }
    if (reasonRequired && !reason.trim())      { setReasonError(true); hasError = true; }
    if (hasError) { nameRef.current?.focus(); return; }

    setNameError(false);
    setReasonError(false);
    setSaving(true);

    const assignee: WorkflowAssignee = {
      role: effectiveRole || (offerWorkflowRoles[0] ?? 'Offer Manager'),
      name: name.trim(),
    };

    const actorEmail = user?.email ?? '';
    const actorName  = user?.displayName || actorEmail.split('@')[0] || 'User';

    const entry: WorkflowLogEntry = {
      id:          crypto.randomUUID(),
      type:        'transition',
      actor_name:  actorName,
      actor_email: actorEmail,
      assignee,
      from_status: fromStatus,
      to_status:   toStatus,
      reason:      reason.trim(),
      created_at:  new Date().toISOString(),
    };

    try {
      await onConfirm(entry);
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status: OfferStatus, highlight?: boolean) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      highlight
        ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
        : 'bg-slate-100 text-slate-700'
    }`}>
      {STATUS_LABELS[status]?.en ?? status}{highlight && isWin ? ' 🏆' : ''}
    </span>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <UserCheck size={18} className="text-amber-600" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Change Offer Status</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status transition display */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <p className="text-xs text-slate-500 mb-2">Transition</p>
          <div className="flex items-center gap-3">
            {statusBadge(fromStatus)}
            <ArrowRight size={14} className="text-slate-400 flex-shrink-0" />
            {statusBadge(toStatus, true)}
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-5">

          {/* Assignee */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Responsible for next step
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Role */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Role</label>
                {isCustom ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customRole}
                      onChange={e => setCustomRole(e.target.value)}
                      placeholder="Type role..."
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
                    />
                    <button
                      onClick={() => { setRole(offerWorkflowRoles[0] ?? 'Offer Manager'); setCustomRole(''); }}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 bg-white"
                  >
                    {offerWorkflowRoles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); if (e.target.value.trim()) setNameError(false); }}
                  placeholder="e.g. Sarah Al-Ahmad"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    nameError
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-slate-300 focus:ring-violet-300 focus:border-violet-400'
                  }`}
                />
              </div>
            </div>

            {nameError && (
              <div className="flex items-center gap-1.5 mt-2 text-red-600 text-xs">
                <AlertCircle size={12} />
                <span>Name of responsible person is required</span>
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              {reasonRequired ? 'Reason' : 'Note'}
              {reasonRequired
                ? <span className="text-red-500 ml-1">*</span>
                : <span className="text-xs font-normal text-slate-400 ml-2">(optional)</span>}
            </label>
            <textarea
              value={reason}
              onChange={e => { setReason(e.target.value); if (e.target.value.trim()) setReasonError(false); }}
              rows={3}
              placeholder={
                reasonRequired
                  ? 'Reason is required for this transition...'
                  : 'e.g. Sent for legal review, awaiting sign-off...'
              }
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 resize-none ${
                reasonError
                  ? 'border-red-400 focus:ring-red-300'
                  : 'border-slate-300 focus:ring-violet-300 focus:border-violet-400'
              }`}
            />
            {reasonError && (
              <div className="flex items-center gap-1.5 mt-1 text-red-600 text-xs">
                <AlertCircle size={12} />
                <span>Reason is required for this transition</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <UserCheck size={16} />
            )}
            {saving ? 'Saving...' : 'Confirm Transition'}
          </button>
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
