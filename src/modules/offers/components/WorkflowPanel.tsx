import React from 'react';
import {
  ArrowRight, MessageSquare, RefreshCw,
  CheckCircle, XCircle, Info, User,
} from 'lucide-react';
import { Offer, OfferStatus, STATUS_LABELS, WorkflowLogEntry } from '../types';
import { getAvailableTransitions } from '../utils/stateMachine';
import WorkflowBadge from './WorkflowBadge';

const TRANSITION_LABELS: Partial<Record<OfferStatus, { en: string; ar: string }>> = {
  under_review:     { en: 'Submit for Review',  ar: 'إرسال للمراجعة'      },
  pending_approval: { en: 'Send to Approval',   ar: 'إرسال للاعتماد'      },
  approved:         { en: 'Approve',            ar: 'اعتماد'              },
  sent_to_client:   { en: 'Send to Client',     ar: 'إرسال للعميل'        },
  won:              { en: 'Mark as Won',        ar: 'تحديد كمكسوب'        },
  lost:             { en: 'Mark as Lost',       ar: 'تحديد كخسارة'        },
  revised:          { en: 'Request Revision',   ar: 'طلب تعديل'           },
  draft:            { en: 'Return to Draft',    ar: 'إعادة للمسودة'       },
  archived:         { en: 'Archive',            ar: 'أرشفة'              },
};

interface Props {
  offer:               Offer;
  workflowLog:         WorkflowLogEntry[];
  onTransitionRequest: (toStatus: OfferStatus) => void;
  onNoteRequest:       () => void;
}

export default function WorkflowPanel({
  offer, workflowLog, onTransitionRequest, onNoteRequest,
}: Props) {
  const available   = getAvailableTransitions(offer.status);
  const latestEntry = workflowLog[0] ?? null;
  const lang        = offer.language;

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">

      {/* ── Current status ────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-xs text-slate-400 mb-1.5">Current status</p>
        <WorkflowBadge status={offer.status} lang={lang} />

        {latestEntry?.assignee && (
          <p className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <User size={11} className="text-slate-400" />
            <span className="font-medium text-slate-700">{latestEntry.assignee.role}</span>
            {latestEntry.assignee.name && (
              <span className="text-slate-400">/ {latestEntry.assignee.name}</span>
            )}
          </p>
        )}
      </div>

      {/* ── Actions ───────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-100 space-y-2">
        {available.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-500">Transitions</p>
            {available.map(toStatus => {
              const labelMeta = TRANSITION_LABELS[toStatus];
              const label = labelMeta ? (labelMeta[lang] ?? labelMeta.en) : STATUS_LABELS[toStatus]?.[lang];
              return (
                <button
                  key={toStatus}
                  onClick={() => onTransitionRequest(toStatus)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                >
                  <span>{label}</span>
                  <ArrowRight size={11} />
                </button>
              );
            })}
          </div>
        )}

        <button
          onClick={onNoteRequest}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          <MessageSquare size={11} />
          {lang === 'ar' ? 'إضافة ملاحظة' : 'Add Note'}
        </button>
      </div>

      {/* ── Audit trail ───────────────────────────────────────────────── */}
      <div className="px-4 py-3">
        <p className="text-xs font-medium text-slate-500 mb-3">
          {lang === 'ar' ? 'السجل' : 'History'}
          {workflowLog.length > 0 && (
            <span className="ml-1.5 text-slate-400">({workflowLog.length})</span>
          )}
        </p>

        {workflowLog.length === 0 ? (
          <p className="text-xs text-slate-400">
            {lang === 'ar' ? 'لا توجد أنشطة بعد' : 'No activity yet'}
          </p>
        ) : (
          <ol className="space-y-3 relative border-l border-slate-200 ml-2">
            {workflowLog.map(entry => (
              <li key={entry.id} className="pl-4 relative">
                <span className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                  entry.type === 'note'
                    ? 'bg-blue-300'
                    : entry.to_status === 'won' || entry.to_status === 'approved'
                      ? 'bg-emerald-400'
                      : entry.to_status === 'lost'
                        ? 'bg-red-400'
                        : 'bg-violet-300'
                }`} />

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

                {/* Status label in the offer's language */}
                <p className="text-xs text-slate-600">
                  {entry.type === 'note' ? (
                    <span className="text-blue-600 font-medium">
                      {lang === 'ar' ? 'ملاحظة' : 'Note'}
                    </span>
                  ) : entry.from_status ? (
                    <>
                      {STATUS_LABELS[entry.from_status]?.[lang]}
                      {' → '}
                      <span className="font-medium">
                        {STATUS_LABELS[entry.to_status]?.[lang]}
                      </span>
                    </>
                  ) : (
                    <>
                      {lang === 'ar' ? 'أُنشئ بوصف' : 'Created as'}{' '}
                      <span className="font-medium">
                        {STATUS_LABELS[entry.to_status]?.[lang]}
                      </span>
                    </>
                  )}
                </p>

                {entry.assignee?.name && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {entry.assignee.role} / {entry.assignee.name}
                  </p>
                )}

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
