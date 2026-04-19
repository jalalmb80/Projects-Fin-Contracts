/**
 * WorkflowTimeline
 *
 * Renders the full workflow audit trail for a contract.
 * Used as the content of the "سجل الإجراءات" tab inside ContractEditor.
 *
 * Props:
 *   contract        — the full contract (reads workflow_events and status)
 *   contractId      — passed separately for the addWorkflowEvent hook call
 *   onAddNote       — parent opens WorkflowNoteModal, resolves with saved event
 *   onStatusChange  — parent opens WorkflowTransitionModal (re-uses editor flow)
 */
import React, { useState } from 'react';
import {
  Plus, ArrowLeft, MessageSquare, RefreshCw,
  Clock, User, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Contract, WorkflowEvent } from '../types';
import { useLang, t } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';

interface Props {
  contract: Contract;
  onAddNote: () => void;
  onStatusChange: () => void;
}

// ── helpers ───────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ar-SA', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ── StatusBadge ────────────────────────────────────────────────────────────
function StatusBadge({ label, isWin }: { label: string; isWin?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
      isWin
        ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
        : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
    }`}>
      {label}{isWin ? ' 🏆' : ''}
    </span>
  );
}

// ── EventCard ─────────────────────────────────────────────────────────────
function EventCard({ event, isFirst, winStatuses }: {
  event: WorkflowEvent;
  isFirst: boolean;
  winStatuses: string[];
}) {
  const { lang } = useLang();
  const [expanded, setExpanded] = useState(isFirst);
  const isTransition = event.type === 'transition';
  const isWinTo = winStatuses.includes(event.to_status);

  const borderColor = isTransition
    ? (isWinTo ? 'border-emerald-200' : 'border-amber-200')
    : 'border-blue-200';
  const bgColor = isTransition
    ? (isWinTo ? 'bg-emerald-50/40' : 'bg-amber-50/30')
    : 'bg-blue-50/30';
  const iconBg = isTransition
    ? (isWinTo ? 'bg-emerald-100' : 'bg-amber-100')
    : 'bg-blue-100';
  const iconColor = isTransition
    ? (isWinTo ? 'text-emerald-700' : 'text-amber-700')
    : 'text-blue-700';

  return (
    <div className={`border rounded-xl overflow-hidden ${borderColor} ${bgColor}`}>
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-right"
      >
        {/* Icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          {isTransition
            ? <RefreshCw size={14} className={iconColor} />
            : <MessageSquare size={14} className={iconColor} />}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          {isTransition ? (
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge label={event.from_status ?? '—'} />
              <ArrowLeft size={12} className="text-slate-400 shrink-0" />
              <StatusBadge label={event.to_status} isWin={isWinTo} />
            </div>
          ) : (
            <span className="text-sm font-semibold text-blue-700">
              {t('ملاحظة', 'Note', lang)}
            </span>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatDate(event.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <User size={11} />
              {event.actor_name}
            </span>
          </div>
        </div>

        {/* Assignee pill — always visible */}
        <div className="shrink-0 text-xs text-slate-600 bg-white/70 border border-slate-200 rounded-full px-2.5 py-1 hidden sm:block">
          <span className="font-medium">{event.assignee.role}</span>
          {event.assignee.name && (
            <span className="text-slate-400"> / {event.assignee.name}</span>
          )}
        </div>

        {/* Expand toggle */}
        <div className="shrink-0 text-slate-400">
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-2 border-t border-slate-100/60">
          {/* Assignee full (mobile) */}
          <div className="sm:hidden flex items-center gap-1.5 text-xs text-slate-600">
            <User size={12} className="text-slate-400" />
            <span className="font-medium">{event.assignee.role}</span>
            {event.assignee.name && (
              <span className="text-slate-400"> / {event.assignee.name}</span>
            )}
          </div>

          {/* Assignee full (desktop: label) */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600">
            <User size={12} className="text-slate-400" />
            <span className="text-slate-500">{t('المسؤول', 'Responsible', lang)}:</span>
            <span className="font-medium">{event.assignee.role} / {event.assignee.name}</span>
          </div>

          {/* Note */}
          {event.note && (
            <div className="bg-white/70 rounded-lg px-3 py-2.5 text-sm text-slate-700 leading-relaxed border border-slate-100" dir="rtl">
              {event.note}
            </div>
          )}

          {/* Actor */}
          <p className="text-xs text-slate-400">
            {t('بواسطة', 'By', lang)}: {event.actor_email}
          </p>
        </div>
      )}
    </div>
  );
}

// ── WorkflowTimeline (main export) ────────────────────────────────────────
export default function WorkflowTimeline({ contract, onAddNote, onStatusChange }: Props) {
  const { lang } = useLang();
  const { contractStatuses, winStatuses } = useSettings();

  const events: WorkflowEvent[] = contract.workflow_events ?? [];
  // Already stored newest-first; no re-sort needed
  const latestEvent = events[0] ?? null;

  // Current status config for badge coloring
  const currentStatusConfig = contractStatuses.find(s => s.label === contract.status);
  const currentIsWin = currentStatusConfig?.is_win ?? false;

  return (
    <div className="space-y-6">

      {/* ── Current status banner ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {t('الحالة الحالية', 'Current Status', lang)}
            </p>
            <StatusBadge label={contract.status} isWin={currentIsWin} />

            {latestEvent && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <User size={12} />
                <span className="font-medium text-slate-700">
                  {latestEvent.assignee.role} / {latestEvent.assignee.name}
                </span>
                <span className="text-slate-400">— {t('مسؤول الخطوة الحالية', 'responsible for current step', lang)}</span>
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onAddNote}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-sm font-medium transition-colors"
            >
              <MessageSquare size={15} />
              {t('إضافة ملاحظة', 'Add Note', lang)}
            </button>
            <button
              onClick={onStatusChange}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium transition-colors"
            >
              <RefreshCw size={15} />
              {t('تغيير الحالة', 'Change Status', lang)}
            </button>
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div>
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
          {t('سجل الأحداث', 'Event Log', lang)}
          {events.length > 0 && (
            <span className="mr-2 text-xs font-normal text-slate-400">({events.length})</span>
          )}
        </h3>

        {events.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
            <RefreshCw className="mx-auto h-10 w-10 text-slate-200 mb-3" />
            <p className="text-sm font-medium text-slate-500">
              {t('لا توجد إجراءات مسجّلة بعد', 'No workflow events recorded yet', lang)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {t(
                'ستظهر هنا عند تغيير حالة العقد أو إضافة ملاحظة',
                'Events appear here when you change the contract status or add a note',
                lang,
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((ev, idx) => (
              <EventCard
                key={ev.id}
                event={ev}
                isFirst={idx === 0}
                winStatuses={winStatuses}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
