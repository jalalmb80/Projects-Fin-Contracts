import React, { useState } from 'react';
import { ArrowRight, Clock, CheckCircle, XCircle, Info } from 'lucide-react';
import { Offer, OfferStatus, STATUS_LABELS, WorkflowLogEntry } from '../types';
import { getAvailableTransitions, REASON_REQUIRED } from '../utils/stateMachine';
import WorkflowBadge from './WorkflowBadge';

const TRANSITION_LABELS: Partial<Record<OfferStatus, string>> = {
  under_review:     'Submit for Review',
  pending_approval: 'Send to Approval',
  approved:         'Approve',
  sent_to_client:   'Send to Client',
  won:              'Mark as Won',
  lost:             'Mark as Lost',
  revised:          'Request Revision',
  draft:            'Return to Draft',
  archived:         'Archive',
};

interface Props {
  offer: Offer;
  onTransition: (toStatus: OfferStatus, reason: string) => Promise<void>;
}

export default function WorkflowPanel({ offer, onTransition }: Props) {
  const [selectedStatus, setSelectedStatus] = useState<OfferStatus | null>(null);
  const [reason,         setReason]         = useState('');
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');

  const available = getAvailableTransitions(offer.status);
  const log       = offer.workflow_log ?? [];

  async function handleConfirm() {
    if (!selectedStatus) return;
    if (REASON_REQUIRED.includes(selectedStatus) && !reason.trim()) {
      setError('A reason is required for this transition.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onTransition(selectedStatus, reason.trim());
      setSelectedStatus(null);
      setReason('');
    } catch (e) {
      setError('Failed to update. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 overflow-y-auto">
      {/* Current status */}
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-xs text-slate-400 mb-1">Current status</p>
        <WorkflowBadge status={offer.status} />
      </div>

      {/* Available transitions */}
      {available.length > 0 && (
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-2">Actions</p>
          <div className="space-y-1.5">
            {available.map(toStatus => (
              <button
                key={toStatus}
                onClick={() => { setSelectedStatus(toStatus); setError(''); setReason(''); }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  selectedStatus === toStatus
                    ? 'border-violet-400 bg-violet-50 text-violet-700'
                    : 'border-slate-200 text-slate-700 hover:border-violet-300 hover:bg-violet-50'
                }`}
              >
                <span>{TRANSITION_LABELS[toStatus] ?? STATUS_LABELS[toStatus].en}</span>
                <ArrowRight size={11} />
              </button>
            ))}
          </div>

          {selectedStatus && (
            <div className="mt-3 space-y-2">
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={
                  REASON_REQUIRED.includes(selectedStatus)
                    ? 'Reason required...'
                    : 'Optional note...'
                }
                rows={3}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  disabled={saving}
                  className="flex-1 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 disabled:opacity-60 transition-colors"
                >
                  {saving ? 'Saving...' : 'Confirm'}
                </button>
                <button
                  onClick={() => { setSelectedStatus(null); setReason(''); setError(''); }}
                  className="flex-1 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Workflow log */}
      <div className="px-4 py-3">
        <p className="text-xs font-medium text-slate-500 mb-3">History</p>
        {log.length === 0 ? (
          <p className="text-xs text-slate-400">No activity yet</p>
        ) : (
          <ol className="space-y-3 relative border-l border-slate-200 ml-2">
            {log.map(entry => (
              <li key={entry.id} className="pl-4 relative">
                <span className="absolute -left-1.5 top-1 w-3 h-3 rounded-full border-2 border-white bg-violet-300" />
                <div className="flex items-center gap-1.5 mb-0.5">
                  {entry.is_system_generated ? (
                    <Info size={10} className="text-slate-400" />
                  ) : entry.to_status === 'won' || entry.to_status === 'approved' ? (
                    <CheckCircle size={10} className="text-emerald-500" />
                  ) : entry.to_status === 'lost' ? (
                    <XCircle size={10} className="text-red-400" />
                  ) : (
                    <Clock size={10} className="text-slate-400" />
                  )}
                  <span className="text-xs text-slate-600 font-medium">
                    {entry.actor_name || entry.actor_email}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {entry.from_status
                    ? `${STATUS_LABELS[entry.from_status]?.en} \u2192 ${STATUS_LABELS[entry.to_status]?.en}`
                    : `Created as ${STATUS_LABELS[entry.to_status]?.en}`}
                </p>
                {entry.reason && (
                  <p className="text-xs text-slate-400 italic mt-0.5">"{entry.reason}"</p>
                )}
                <p className="text-xs text-slate-300 mt-0.5">
                  {new Date(entry.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
