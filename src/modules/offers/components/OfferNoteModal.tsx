/**
 * OfferNoteModal
 *
 * Opens when the user clicks "Add Note" in WorkflowPanel.
 * Status does NOT change — from_status === to_status.
 * Note text is REQUIRED (unlike transition reason which may be optional).
 *
 * Produces WorkflowLogEntry { type: 'note', assignee, reason: noteText }.
 * Pure UI — no Firestore calls; caller handles persistence.
 *
 * Mirrors CMS WorkflowNoteModal.tsx in structure.
 */
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageSquare, AlertCircle } from 'lucide-react';
import { WorkflowLogEntry, WorkflowAssignee, OfferStatus, STATUS_LABELS } from '../types';
import { useOffersSettings } from '../context/OffersSettingsContext';
import { usePlatform } from '../../../core/context/PlatformContext';

interface Props {
  currentStatus: OfferStatus;
  onConfirm:     (entry: WorkflowLogEntry) => Promise<void>;
  onCancel:      () => void;
}

export default function OfferNoteModal({ currentStatus, onConfirm, onCancel }: Props) {
  const { user }               = usePlatform();
  const { offerWorkflowRoles } = useOffersSettings();

  const [role,       setRole]       = useState(offerWorkflowRoles[0] ?? 'Offer Manager');
  const [customRole, setCustomRole] = useState('');
  const [name,       setName]       = useState('');
  const [noteText,   setNoteText]   = useState('');
  const [saving,     setSaving]     = useState(false);
  const [nameError,  setNameError]  = useState(false);
  const [noteError,  setNoteError]  = useState(false);

  const noteRef  = useRef<HTMLTextAreaElement>(null);
  const isCustom = role === 'Other';
  const effectiveRole = isCustom ? customRole.trim() : role;

  useEffect(() => { noteRef.current?.focus(); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onCancel]);

  const handleConfirm = async () => {
    let hasError = false;
    if (!name.trim())     { setNameError(true); hasError = true; }
    if (!noteText.trim()) { setNoteError(true); hasError = true; }
    if (hasError) return;

    setNameError(false);
    setNoteError(false);
    setSaving(true);

    const assignee: WorkflowAssignee = {
      role: effectiveRole || (offerWorkflowRoles[0] ?? 'Offer Manager'),
      name: name.trim(),
    };

    const actorEmail = user?.email ?? '';
    const actorName  = user?.displayName || actorEmail.split('@')[0] || 'User';

    const entry: WorkflowLogEntry = {
      id:          crypto.randomUUID(),
      type:        'note',
      actor_name:  actorName,
      actor_email: actorEmail,
      assignee,
      from_status: currentStatus,
      to_status:   currentStatus,  // no status change
      reason:      noteText.trim(),
      created_at:  new Date().toISOString(),
    };

    try {
      await onConfirm(entry);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <MessageSquare size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Add Workflow Note</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Status stays at{' '}
                <span className="font-medium text-slate-600">
                  {STATUS_LABELS[currentStatus]?.en ?? currentStatus}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-5">

          {/* Assignee */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Currently responsible <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Role</label>
                {isCustom ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customRole}
                      onChange={e => setCustomRole(e.target.value)}
                      placeholder="Type role..."
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white"
                  >
                    {offerWorkflowRoles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); if (e.target.value.trim()) setNameError(false); }}
                  placeholder="e.g. Sarah Al-Ahmad"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    nameError
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-slate-300 focus:ring-blue-300 focus:border-blue-400'
                  }`}
                />
                {nameError && (
                  <p className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                    <AlertCircle size={12} /> Required
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Note text (required) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Note <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={noteRef}
              value={noteText}
              onChange={e => { setNoteText(e.target.value); if (e.target.value.trim()) setNoteError(false); }}
              rows={4}
              placeholder="Record what was discussed or the action taken..."
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 resize-none ${
                noteError
                  ? 'border-red-400 focus:ring-red-300'
                  : 'border-slate-300 focus:ring-blue-300 focus:border-blue-400'
              }`}
            />
            {noteError && (
              <div className="flex items-center gap-1.5 mt-1 text-red-600 text-xs">
                <AlertCircle size={12} />
                <span>Note text is required</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <MessageSquare size={16} />
            )}
            {saving ? 'Saving...' : 'Save Note'}
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
