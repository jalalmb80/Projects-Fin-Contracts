/**
 * WorkflowPanel
 *
 * Right-panel workflow tab in OfferBuilderPage.
 * Shows: current status + assignee, action buttons, audit trail timeline.
 *
 * Phase 1 changes:
 * - Inline form removed; transition and note actions now delegate to modal
 *   components via onTransitionRequest / onNoteRequest props.
 * - workflowLog entries now have assignee.role + assignee.name for display.
 * - type === 'note' entries rendered with blue styling (vs amber for transitions).
 */
import React from 'react';
import {
  ArrowRight, MessageSquare, RefreshCw,
  CheckCircle, XCircle, Clock, Info, User,
} from 'lucide-react';
import { Offer, OfferStatus, STATUS_LABELS, WorkflowLogEntry } from '../types';
import { getAvailableTransitions } from '../utils/stateMachine';
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
  offer:               Offer;
  /** Audit trail from offers/{id}/workflow_log subcollection (newest-first). */
  workflowLog:         WorkflowLogEntry[];
  /**
   * Called when user clicks a transition button.
   * OfferBuilderPage opens OfferTransitionModal with the chosen toStatus.
   */
  onTransitionRequest: (toStatus: OfferStatus) => void;
  /** Called when user clicks "Add Note". OfferBuilderPage opens OfferNoteModal. */
  onNoteRequest:       () => void;
}

export default function WorkflowPanel({
  offer, workflowLog, onTransitionRequest, onNoteRequest,
}: Props) {
  const available    = getAvailableTransitions(offer.status);
  const latestEntry  = workflowLog[0] ?? null;

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">

      {/* ── Current status ──────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-xs text-slate-400 mb-1.5">Current status</p>
        <WorkflowBadge status={offer.status} />

        {/* Latest assignee */}
        {latestEntry?.assignee && (
          <p className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <User size={11} className="text-slate-400" />
            <span className="font-medium text-slate-700">
              {latestEntry.assignee.role}
            </span>
            {latestEntry.assignee.name && (
              <span className="text-slate-400">/ {latestEntry.assignee.name}</span>
            )}
          </p>
        )}
      </div>

      {/* ── Actions ─────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-100 space-y-2">
        {/* Transition buttons */}
        {available.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-500">Transitions</p>
            {available.map(toStatus => (
              <button
                key={toStatus}
                onClick={() => onTransitionRequest(toStatus)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-colors"
              >
                <span>{TRANSITION_LABELS[toStatus] ?? STATUS_LABELS[toStatus]?.en}</span>
                <ArrowRight size={11} />
              </button>
            ))}
          </div>
        )}

        {/* Add note */}
        <button
          onClick={onNoteRequest}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          <MessageSquare size={11} />
          Add Note
        </button>
      </div>

      {/* ── Audit trail ─────────────────────────────────────────── */}
      <div className="px-4 py-3">
        <p className="text-xs font-medium text-slate-500 mb-3">
          History
          {workflowLog.length > 0 && (
            <span className="ml-1.5 text-slate-400">({workflowLog.length})</span>
          )}
        </p>

        {workflowLog.length === 0 ? (
          <p className="text-xs text-slate-400">No activity yet</p>
        ) : (
          <ol className="space-y-3 relative border-l border-slate-200 ml-2">
            {workflowLog.map(entry => (
              <li key={entry.id} className="pl-4 relative">
                {/* Timeline dot */}
                <span className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                  entry.type === 'note'
                    ? 'bg-blue-300'
                    : entry.to_status === 'won' || entry.to_status === 'approved'
                      ? 'bg-emerald-400'
                      : entry.to_status === 'lost'
                        ? 'bg-red-400'
                        : 'bg-violet-300'
                }`} />

                {/* Entry header */}
                <div className="flex items-center gap-1.5 mb-0.5">
                  {entry.is_system_generated ? (
                    <Info size={10} className="text-slate-400" />
                  ) : entry.type === 'note' ? (
                    <MessageSquare size={10} className="text-blue-500" />
                  ) : entry.to_status === 'won' || entry.to_status === 'approved' ? (
                    <CheckCircle size={10} className="text-emerald-500" />
                  ) : entry.to_status === 'lost' ? (
                    <XCircle size={10} className="text-red-400" />
                  ) : (
                    <RefreshCw size={10} className="text-slate-400" />
                  )}
                  <span className="text-xs text-slate-700 font-medium">
                    {entry.actor_name || entry.actor_email}
                  </span>
                </div>

                {/* Transition or note label */}
                <p className="text-xs text-slate-600">
                  {entry.type === 'note' ? (
                    <span className="text-blue-600 font-medium">Note</span>
                  ) : entry.from_status ? (
                    <>
                      {STATUS_LABELS[entry.from_status]?.en}
                      {' \u2192 '}
                      <span className="font-medium">{STATUS_LABELS[entry.to_status]?.en}</span>
                    </>
                  ) : (
                    <>Created as <span className="font-medium">{STATUS_LABELS[entry.to_status]?.en}</span></>
                  )}
                </p>

                {/* Assignee (Phase 1+: has role+name) */}
                {entry.assignee?.name && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {entry.assignee.role} / {entry.assignee.name}
                  </p>
                )}

                {/* Reason / note body */}
                {entry.reason && (
                  <p className="text-xs text-slate-400 italic mt-0.5">"{entry.reason}"</p>
                )}

                {/* Timestamp */}
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
