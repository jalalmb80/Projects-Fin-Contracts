import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, GitBranch, Eye, Edit3 } from 'lucide-react';
import { useOffers } from '../hooks/useOffers';
import { usePlatform } from '../../../core/context/PlatformContext';
import { platformBus, PLATFORM_EVENTS } from '../../../core/events/platformBus';
import {
  Offer, OfferSection, SectionType, OfferStatus,
  WorkflowLogEntry, OfferNote, LineItem, SECTION_TYPE_LABELS,
} from '../types';
import SectionNavigator from '../components/SectionNavigator';
import SectionEditor from '../components/SectionEditor';
import WorkflowPanel from '../components/WorkflowPanel';
import NotesPanel from '../components/NotesPanel';
import WorkflowBadge from '../components/WorkflowBadge';

type RightTab = 'workflow' | 'notes';

const READ_ONLY_STATUSES: OfferStatus[] = ['approved', 'sent_to_client', 'won', 'lost', 'archived'];

export default function OfferBuilderPage() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const { user }   = usePlatform();
  const {
    offers, updateOffer, addWorkflowLogEntry,
    addNote, updateSections, updateLineItems,
  } = useOffers();

  const offer = offers.find(o => o.id === id);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [rightTab,        setRightTab]        = useState<RightTab>('workflow');
  const [toast,           setToast]           = useState<string | null>(null);

  // Auto-select first section
  useEffect(() => {
    if (offer && !activeSectionId && offer.sections.length > 0) {
      const sorted = [...offer.sections].sort((a, b) => a.position - b.position);
      setActiveSectionId(sorted[0].id);
    }
  }, [offer?.id, offer?.sections.length]);

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

  const readOnly  = READ_ONLY_STATUSES.includes(offer.status);
  const dir       = offer.language === 'ar' ? 'rtl' : 'ltr';
  const sorted    = [...offer.sections].sort((a, b) => a.position - b.position);
  const activeSection = sorted.find(s => s.id === activeSectionId) ?? null;

  // ── Section mutations ───────────────────────────────────────────────────────

  async function handleAddSection(type: SectionType) {
    const label    = SECTION_TYPE_LABELS[type];
    const maxPos   = sorted.length > 0 ? Math.max(...sorted.map(s => s.position)) : 0;
    const newSec: OfferSection = {
      id:         crypto.randomUUID(),
      type,
      title_en:   label.en,
      title_ar:   label.ar,
      position:   maxPos + 1,
      is_fixed:   false,
      content:    '',
      is_visible: true,
    };
    const next = [...offer.sections, newSec];
    await updateSections(offer.id, next);
    setActiveSectionId(newSec.id);
  }

  async function handleRemoveSection(sectionId: string) {
    const sec = offer.sections.find(s => s.id === sectionId);
    if (sec?.is_fixed) return;
    const next = offer.sections.filter(s => s.id !== sectionId);
    await updateSections(offer.id, next);
    if (activeSectionId === sectionId) {
      setActiveSectionId(next[0]?.id ?? null);
    }
  }

  function move(sectionId: string, dir: 1 | -1) {
    const list = [...sorted];
    const idx  = list.findIndex(s => s.id === sectionId);
    if (idx === -1) return;
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    // Swap positions
    const aPos = list[idx].position;
    const bPos = list[target].position;
    const next = offer.sections.map(s => {
      if (s.id === list[idx].id)    return { ...s, position: bPos };
      if (s.id === list[target].id) return { ...s, position: aPos };
      return s;
    });
    updateSections(offer.id, next);
  }

  async function handleContentChange(sectionId: string, content: string) {
    const next = offer.sections.map(s =>
      s.id === sectionId ? { ...s, content } : s,
    );
    await updateSections(offer.id, next);
  }

  async function handleTitleChange(sectionId: string, title: string) {
    const next = offer.sections.map(s =>
      s.id === sectionId
        ? offer.language === 'ar'
          ? { ...s, title_ar: title }
          : { ...s, title_en: title }
        : s,
    );
    await updateSections(offer.id, next);
  }

  async function handleSaveLineItems(
    items: LineItem[],
    discountPct: number,
    vatRate: number,
  ) {
    await updateLineItems(offer.id, items, discountPct, vatRate);
    showToast('Pricing saved');
  }

  // ── Workflow ────────────────────────────────────────────────────────────────

  async function handleTransition(toStatus: OfferStatus, reason: string) {
    if (!user) return;
    const entry: WorkflowLogEntry = {
      id:          crypto.randomUUID(),
      actor_name:  user.displayName ?? user.email ?? '',
      actor_email: user.email ?? '',
      from_status: offer.status,
      to_status:   toStatus,
      reason,
      created_at:  new Date().toISOString(),
    };
    await addWorkflowLogEntry(offer.id, entry, toStatus);

    // Add system note for the transition
    const systemNote: OfferNote = {
      id:                  crypto.randomUUID(),
      author_name:         'System',
      author_email:        '',
      note_type:           'approval_decision',
      visibility:          'internal',
      body:                `Status changed to "${toStatus.replace(/_/g, ' ')}"
${reason ? `Reason: ${reason}` : ''}`.trim(),
      parent_note_id:      null,
      is_system_generated: true,
      is_pinned:           false,
      created_at:          new Date().toISOString(),
    };
    await addNote(offer.id, systemNote);

    // Emit platformBus event when offer is won
    if (toStatus === 'won') {
      platformBus.emit(PLATFORM_EVENTS.OFFER_WON, {
        offerId:     offer.id,
        offerNumber: offer.offer_number,
        clientName:  offer.client_name,
        totalValue:  offer.total_value,
      });
    }

    showToast(`Status updated to ${toStatus.replace(/_/g, ' ')}`);
  }

  async function handleAddNote(note: OfferNote) {
    await addNote(offer.id, note);
    showToast('Note added');
  }

  return (
    <div className="flex flex-col h-full" dir={dir}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/offers/list')}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            aria-label="Back to offers"
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

        <div className="flex items-center gap-2 text-sm text-slate-500">
          {offer.client_name && <span>{offer.client_name}</span>}
          {offer.expiry_date && (
            <span className="text-xs text-slate-400">Expires {offer.expiry_date}</span>
          )}
        </div>
      </header>

      {/* Three-panel body */}
      <div className="flex-1 overflow-hidden grid grid-cols-[200px_1fr_280px]">
        {/* Left — Section Navigator */}
        <SectionNavigator
          sections={offer.sections}
          activeSectionId={activeSectionId}
          language={offer.language}
          onSelect={setActiveSectionId}
          onMoveUp={id => move(id, -1)}
          onMoveDown={id => move(id, 1)}
          onRemove={handleRemoveSection}
          onAddSection={handleAddSection}
        />

        {/* Center — Section Editor */}
        <SectionEditor
          section={activeSection}
          offer={offer}
          language={offer.language}
          readOnly={readOnly}
          onContentChange={handleContentChange}
          onTitleChange={handleTitleChange}
          onSaveLineItems={handleSaveLineItems}
        />

        {/* Right — Workflow + Notes */}
        <div className="flex flex-col border-l border-slate-200">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 flex-shrink-0">
            <button
              onClick={() => setRightTab('workflow')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                rightTab === 'workflow'
                  ? 'text-violet-700 border-b-2 border-violet-600 -mb-px'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <GitBranch size={12} /> Workflow
            </button>
            <button
              onClick={() => setRightTab('notes')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                rightTab === 'notes'
                  ? 'text-violet-700 border-b-2 border-violet-600 -mb-px'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <MessageSquare size={12} /> Notes
              {offer.notes.length > 0 && (
                <span className="ml-0.5 bg-violet-100 text-violet-700 text-xs rounded-full px-1.5">
                  {offer.notes.length}
                </span>
              )}
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {rightTab === 'workflow' ? (
              <WorkflowPanel
                offer={offer}
                onTransition={handleTransition}
              />
            ) : (
              <NotesPanel
                notes={offer.notes}
                onAddNote={handleAddNote}
              />
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
    </div>
  );
}
