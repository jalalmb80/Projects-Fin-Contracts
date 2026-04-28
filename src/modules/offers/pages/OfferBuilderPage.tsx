import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, GitBranch, Eye, FileDown, History } from 'lucide-react';
import { useOffersContext } from '../context/OffersContext';
import { useOfferDetail } from '../hooks/useOfferDetail';
import { useOfferVersions } from '../hooks/useOfferVersions';
import { usePlatform } from '../../../core/context/PlatformContext';
import { platformBus, PLATFORM_EVENTS } from '../../../core/events/platformBus';
import {
  OfferSection, SectionType, OfferStatus,
  WorkflowLogEntry, OfferNote, OfferVersion, OfferVersionSnapshot,
  LineItem, SECTION_TYPE_LABELS, STATUS_LABELS,
} from '../types';
import SectionNavigator from '../components/SectionNavigator';
import SectionEditor from '../components/SectionEditor';
import WorkflowPanel from '../components/WorkflowPanel';
import NotesPanel from '../components/NotesPanel';
import WorkflowBadge from '../components/WorkflowBadge';
import OfferTransitionModal from '../components/OfferTransitionModal';
import OfferNoteModal from '../components/OfferNoteModal';
import OfferPreviewPortal from '../components/OfferPreviewPortal';

type RightTab   = 'workflow' | 'notes' | 'history';
type PreviewMode = 'preview' | 'download';

const READ_ONLY_STATUSES: OfferStatus[] = [
  'approved', 'sent_to_client', 'won', 'lost', 'archived',
];

// ── Version history panel ────────────────────────────────────────────

function VersionsPanel({ versions, loading }: { versions: OfferVersion[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto p-4">
      <p className="text-xs font-medium text-slate-500 mb-3">
        Snapshots
        {versions.length > 0 && (
          <span className="ml-1.5 text-slate-400">({versions.length})</span>
        )}
      </p>

      {versions.length === 0 ? (
        <p className="text-xs text-slate-400 leading-relaxed">
          Snapshots are saved automatically on each status transition.
          None yet.
        </p>
      ) : (
        <ol className="space-y-2.5">
          {versions.map(v => (
            <li key={v.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-violet-700">v{v.version_number}</span>
                <span className="text-xs text-slate-400">
                  {new Date(v.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-600">{v.change_summary}</p>
              <p className="text-xs text-slate-400 mt-1">
                {v.snapshot.sections.length} section{v.snapshot.sections.length !== 1 ? 's' : ''}
                {' \u00b7 '}
                {v.snapshot.line_items.length} item{v.snapshot.line_items.length !== 1 ? 's' : ''}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function OfferBuilderPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = usePlatform();

  const {
    offers, addWorkflowLogEntry, addNote,
    updateSections, updateLineItems,
  } = useOffersContext();

  const { workflowLog, notes }           = useOfferDetail(id);
  const { versions, loadingVersions }    = useOfferVersions(id);

  const offer = offers.find(o => o.id === id);

  const [activeSectionId,     setActiveSectionId]     = useState<string | null>(null);
  const [rightTab,            setRightTab]            = useState<RightTab>('workflow');
  const [toast,               setToast]               = useState<string | null>(null);
  const [pendingTransitionTo, setPendingTransitionTo] = useState<OfferStatus | null>(null);
  const [showNoteModal,       setShowNoteModal]       = useState(false);
  const [previewMode,         setPreviewMode]         = useState<PreviewMode | null>(null);

  useEffect(() => {
    if (offer && !activeSectionId && offer.sections.length > 0) {
      const sorted = [...offer.sections].sort((a, b) => a.position - b.position);
      setActiveSectionId(sorted[0].id);
    }
  }, [offer?.id]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  if (!offer) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 text-sm">Offer not found</p>
          <button onClick={() => navigate('/offers/list')} className="mt-2 text-xs text-violet-600 hover:underline">
            Back to list
          </button>
        </div>
      </div>
    );
  }

  const readOnly      = READ_ONLY_STATUSES.includes(offer.status);
  const dir           = offer.language === 'ar' ? 'rtl' : 'ltr';
  const sorted        = [...offer.sections].sort((a, b) => a.position - b.position);
  const activeSection = sorted.find(s => s.id === activeSectionId) ?? null;

  // ── Section mutations ─────────────────────────────────────────────────────

  async function handleAddSection(type: SectionType) {
    const label  = SECTION_TYPE_LABELS[type];
    const maxPos = sorted.length > 0 ? Math.max(...sorted.map(s => s.position)) : 0;
    const newSec: OfferSection = {
      id: crypto.randomUUID(), type,
      title_en: label.en, title_ar: label.ar,
      position: maxPos + 1, is_fixed: false, content: '', is_visible: true,
    };
    await updateSections(offer.id, [...offer.sections, newSec]);
    setActiveSectionId(newSec.id);
  }

  async function handleRemoveSection(sectionId: string) {
    const sec = offer.sections.find(s => s.id === sectionId);
    if (sec?.is_fixed) return;
    const next = offer.sections.filter(s => s.id !== sectionId);
    await updateSections(offer.id, next);
    if (activeSectionId === sectionId) setActiveSectionId(next[0]?.id ?? null);
  }

  function move(sectionId: string, direction: 1 | -1) {
    const list   = [...sorted];
    const idx    = list.findIndex(s => s.id === sectionId);
    if (idx === -1) return;
    const target = idx + direction;
    if (target < 0 || target >= list.length) return;
    const aPos   = list[idx].position;
    const bPos   = list[target].position;
    updateSections(offer.id, offer.sections.map(s => {
      if (s.id === list[idx].id)    return { ...s, position: bPos };
      if (s.id === list[target].id) return { ...s, position: aPos };
      return s;
    }));
  }

  async function handleContentChange(sectionId: string, content: string) {
    await updateSections(offer.id, offer.sections.map(s =>
      s.id === sectionId ? { ...s, content } : s,
    ));
  }

  async function handleTitleChange(sectionId: string, title: string) {
    await updateSections(offer.id, offer.sections.map(s =>
      s.id === sectionId
        ? offer.language === 'ar' ? { ...s, title_ar: title } : { ...s, title_en: title }
        : s,
    ));
  }

  async function handleSaveLineItems(items: LineItem[], discountPct: number, vatRate: number) {
    await updateLineItems(offer.id, items, discountPct, vatRate);
    showToast('Pricing saved');
  }

  // ── Workflow — transition ─────────────────────────────────────────────────

  async function handleTransitionConfirm(entry: WorkflowLogEntry) {
    if (!user) return;

    // System note (batched atomically with log entry + status + snapshot)
    const systemNote: OfferNote = {
      id:                  crypto.randomUUID(),
      author_name:         'System',
      author_email:        '',
      note_type:           'approval_decision',
      visibility:          'internal',
      body:                [
        `Status changed to "${STATUS_LABELS[entry.to_status]?.en ?? entry.to_status}"`,
        entry.reason ? `Reason: ${entry.reason}` : '',
        entry.assignee.name ? `Responsible: ${entry.assignee.role} / ${entry.assignee.name}` : '',
      ].filter(Boolean).join('\n'),
      parent_note_id:      null,
      is_system_generated: true,
      is_pinned:           false,
      created_at:          entry.created_at,
    };

    // Version snapshot — captures the pre-transition content state.
    // Excludes deprecated subcollection fields via destructuring.
    const { notes: _n, workflow_log: _wl, ...offerSnap } = offer;
    const versionSnapshot: OfferVersion = {
      id:             crypto.randomUUID(),
      version_number: workflowLog.length + 1,
      created_at:     entry.created_at,
      change_summary: `Status: ${STATUS_LABELS[offer.status]?.en} \u2192 ${STATUS_LABELS[entry.to_status]?.en}`,
      snapshot:       offerSnap as OfferVersionSnapshot,
    };

    // One atomic writeBatch: log entry + status + systemNote + version snapshot
    await addWorkflowLogEntry(
      offer.id, entry, entry.to_status, systemNote, versionSnapshot,
    );

    // Emit OFFER_WON with full payload (clientId added in Phase 3)
    if (entry.to_status === 'won') {
      platformBus.emit(PLATFORM_EVENTS.OFFER_WON, {
        offerId:     offer.id,
        offerNumber: offer.offer_number,
        clientId:    offer.client_id,
        clientName:  offer.client_name,
        totalValue:  offer.total_value,
      });
    }

    setPendingTransitionTo(null);
    showToast(`Status updated to ${STATUS_LABELS[entry.to_status]?.en ?? entry.to_status}`);
  }

  // ── Workflow — note ────────────────────────────────────────────────────

  async function handleNoteConfirm(entry: WorkflowLogEntry) {
    await addWorkflowLogEntry(offer.id, entry);
    setShowNoteModal(false);
    showToast('Note added');
  }

  async function handleAddNote(note: OfferNote) {
    await addNote(offer.id, note);
    showToast('Note added');
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full" dir={dir}>

      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/offers/list')}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-400">{offer.offer_number}</span>
              <WorkflowBadge status={offer.status} size="sm" />
              {readOnly && (
                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  <Eye size={10} /> View only
                </span>
              )}
            </div>
            <h1 className="text-sm font-semibold text-slate-900 mt-0.5">
              {offer.language === 'ar' ? offer.title_ar : offer.title_en}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {offer.client_name && <span className="text-sm text-slate-500 hidden md:block">{offer.client_name}</span>}
          {offer.expiry_date && <span className="text-xs text-slate-400 hidden md:block">Expires {offer.expiry_date}</span>}
          <button
            onClick={() => setPreviewMode('preview')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 hover:border-violet-300 transition-colors"
          >
            <Eye size={13} /> Preview
          </button>
          <button
            onClick={() => setPreviewMode('download')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 transition-colors"
          >
            <FileDown size={13} /> PDF
          </button>
        </div>
      </header>

      {/* Three-panel body */}
      <div className="flex-1 overflow-hidden grid grid-cols-[200px_1fr_280px]">
        <SectionNavigator
          sections={offer.sections}
          activeSectionId={activeSectionId}
          language={offer.language}
          onSelect={setActiveSectionId}
          onMoveUp={sid => move(sid, -1)}
          onMoveDown={sid => move(sid, 1)}
          onRemove={handleRemoveSection}
          onAddSection={handleAddSection}
        />
        <SectionEditor
          section={activeSection}
          offer={offer}
          language={offer.language}
          readOnly={readOnly}
          onContentChange={handleContentChange}
          onTitleChange={handleTitleChange}
          onSaveLineItems={handleSaveLineItems}
        />

        {/* Right panel — three tabs: Workflow | Notes | History */}
        <div className="flex flex-col border-l border-slate-200">
          <div className="flex border-b border-slate-200 flex-shrink-0">
            {([
              { key: 'workflow', icon: GitBranch,    label: 'Workflow', count: workflowLog.length },
              { key: 'notes',    icon: MessageSquare, label: 'Notes',    count: notes.length },
              { key: 'history',  icon: History,       label: 'History',  count: versions.length },
            ] as const).map(({ key, icon: Icon, label, count }) => (
              <button
                key={key}
                onClick={() => setRightTab(key)}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  rightTab === key
                    ? 'text-violet-700 border-b-2 border-violet-600 -mb-px'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={11} />
                <span className="hidden sm:inline">{label}</span>
                {count > 0 && (
                  <span className="bg-violet-100 text-violet-700 text-xs rounded-full px-1.5 leading-none py-0.5">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {rightTab === 'workflow' && (
              <WorkflowPanel
                offer={offer}
                workflowLog={workflowLog}
                onTransitionRequest={toStatus => { if (!readOnly) setPendingTransitionTo(toStatus); }}
                onNoteRequest={() => setShowNoteModal(true)}
              />
            )}
            {rightTab === 'notes' && (
              <NotesPanel notes={notes} onAddNote={handleAddNote} />
            )}
            {rightTab === 'history' && (
              <VersionsPanel versions={versions} loading={loadingVersions} />
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* Modals */}
      {pendingTransitionTo && (
        <OfferTransitionModal
          fromStatus={offer.status}
          toStatus={pendingTransitionTo}
          onConfirm={handleTransitionConfirm}
          onCancel={() => setPendingTransitionTo(null)}
        />
      )}
      {showNoteModal && (
        <OfferNoteModal
          currentStatus={offer.status}
          onConfirm={handleNoteConfirm}
          onCancel={() => setShowNoteModal(false)}
        />
      )}
      {previewMode && (
        <OfferPreviewPortal
          offer={offer}
          mode={previewMode}
          onClose={() => setPreviewMode(null)}
        />
      )}
    </div>
  );
}
