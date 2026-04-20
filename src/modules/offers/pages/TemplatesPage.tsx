import React, { useState } from 'react';
import { Plus, Archive, Edit2, Check, X } from 'lucide-react';
import { useOffers } from '../hooks/useOffers';
import { usePlatform } from '../../../core/context/PlatformContext';
import {
  OfferTemplate, OfferTemplateSection, OfferLanguage,
  SectionType, SECTION_TYPE_LABELS,
} from '../types';

export default function TemplatesPage() {
  const { templates, createTemplate, updateTemplate, archiveTemplate } = useOffers();
  const { user } = usePlatform();

  const [showModal,  setShowModal]  = useState(false);
  const [nameEn,     setNameEn]     = useState('');
  const [nameAr,     setNameAr]     = useState('');
  const [descEn,     setDescEn]     = useState('');
  const [language,   setLanguage]   = useState<OfferLanguage>('en');
  const [sections,   setSections]   = useState<OfferTemplateSection[]>([]);
  const [creating,   setCreating]   = useState(false);
  const [toast,      setToast]      = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function addSection(type: SectionType) {
    const label = SECTION_TYPE_LABELS[type];
    setSections(prev => [
      ...prev,
      {
        id:              crypto.randomUUID(),
        type,
        title_en:        label.en,
        title_ar:        label.ar,
        position:        prev.length + 1,
        is_fixed:        label.fixed,
        default_content: '',
      },
    ]);
  }

  function removeSection(id: string) {
    setSections(prev => prev.filter(s => s.id !== id));
  }

  async function handleCreate() {
    if (!nameEn.trim() || !user) return;
    setCreating(true);
    try {
      const now = new Date().toISOString();
      const tpl: OfferTemplate = {
        id:             crypto.randomUUID(),
        name_en:        nameEn.trim(),
        name_ar:        nameAr.trim(),
        description_en: descEn.trim(),
        description_ar: '',
        language,
        status:         'active',
        version:        1,
        sections,
        created_by:     user.uid,
        created_at:     now,
        updated_at:     now,
      };
      await createTemplate(tpl);
      showToast(`Template "${tpl.name_en}" created`);
      setShowModal(false);
      resetForm();
    } catch {
      showToast('Failed to create template');
    } finally {
      setCreating(false);
    }
  }

  async function handleArchive(id: string) {
    try {
      await archiveTemplate(id);
      showToast('Template archived');
    } catch {
      showToast('Failed to archive template');
    }
  }

  function resetForm() {
    setNameEn(''); setNameAr(''); setDescEn('');
    setLanguage('en'); setSections([]);
  }

  const active   = templates.filter(t => t.status === 'active');
  const archived = templates.filter(t => t.status === 'archived');

  const ALL_TYPES = Object.keys(SECTION_TYPE_LABELS) as SectionType[];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Offer Templates</h1>
          <p className="text-sm text-slate-500">{active.length} active</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          <Plus size={14} /> New Template
        </button>
      </div>

      {/* Active templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {active.map(t => (
          <TemplateCard key={t.id} template={t} onArchive={() => handleArchive(t.id)} />
        ))}
        {active.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">
            No active templates. Create one to start building offers.
          </div>
        )}
      </div>

      {/* Archived */}
      {archived.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Archived</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-60">
            {archived.map(t => (
              <TemplateCard key={t.id} template={t} archived />
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl my-8">
            <h2 className="text-lg font-semibold text-slate-900">New Template</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Name (EN) *</label>
                <input
                  value={nameEn}
                  onChange={e => setNameEn(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                  placeholder="Template name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1" dir="rtl">الاسم (AR)</label>
                <input
                  value={nameAr}
                  onChange={e => setNameAr(e.target.value)}
                  dir="rtl"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <input
                value={descEn}
                onChange={e => setDescEn(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                placeholder="Optional description"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Default language</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value as OfferLanguage)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
              >
                <option value="en">English</option>
                <option value="ar">\u0639\u0631\u0628\u064a</option>
              </select>
            </div>

            {/* Section picker */}
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">Sections</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {ALL_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => addSection(type)}
                    className="px-2 py-1 text-xs border border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-violet-400 hover:text-violet-600 transition-colors"
                  >
                    + {SECTION_TYPE_LABELS[type].en}
                  </button>
                ))}
              </div>
              {sections.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {sections.map(sec => (
                    <div key={sec.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-1.5">
                      <span className="text-xs text-slate-700">
                        {sec.is_fixed ? '\uD83D\uDD12 ' : ''}{ sec.title_en}
                      </span>
                      <button
                        onClick={() => removeSection(sec.id)}
                        className="p-0.5 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCreate}
                disabled={creating || !nameEn.trim()}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating...' : 'Create Template'}
              </button>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template, onArchive, archived = false,
}: { template: OfferTemplate; onArchive?: () => void; archived?: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="font-medium text-slate-900 text-sm">{template.name_en}</h3>
          {template.name_ar && (
            <p className="text-xs text-slate-500" dir="rtl">{template.name_ar}</p>
          )}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          v{template.version}
        </span>
      </div>

      {template.description_en && (
        <p className="text-xs text-slate-500 mb-3">{template.description_en}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {template.sections.length} section{template.sections.length !== 1 ? 's' : ''}
          {' \u00b7 '}
          {template.language.toUpperCase()}
        </span>
        {!archived && onArchive && (
          <button
            onClick={onArchive}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-orange-500 transition-colors"
          >
            <Archive size={11} /> Archive
          </button>
        )}
        {archived && (
          <span className="text-xs text-slate-400">Archived</span>
        )}
      </div>
    </div>
  );
}
