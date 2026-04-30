/**
 * OfferTemplateEditor
 *
 * Full-screen editor for an OfferTemplate.
 * Two tabs:
 *   Metadata  — name (EN + AR), description (EN), default language.
 *   Sections  — ordered list of template sections with up/down reorder,
 *               add from type picker, remove, and inline editing of
 *               title_en, title_ar, and default_content per section.
 *
 * The editor maintains a local draft copy; changes are written to Firestore
 * only when the user clicks "Save Template" via updateTemplate().
 *
 * Usage (from TemplatesPage):
 *   <OfferTemplateEditor template={template} onClose={() => setEditing(null)} />
 */
import React, { useState } from 'react';
import {
  X, Save, Settings, Layers, ChevronUp, ChevronDown, Plus, Trash2,
} from 'lucide-react';
import {
  OfferTemplate, OfferTemplateSection,
  OfferLanguage, SectionType, SECTION_TYPE_LABELS,
} from '../types';
import { useOffersContext } from '../context/OffersContext';

type Tab = 'metadata' | 'sections';

const ALL_SECTION_TYPES = Object.keys(SECTION_TYPE_LABELS) as SectionType[];

interface Props {
  template: OfferTemplate;
  onClose:  () => void;
}

export default function OfferTemplateEditor({ template: initial, onClose }: Props) {
  const { updateTemplate } = useOffersContext();

  const [draft,      setDraft]      = useState<OfferTemplate>(() => JSON.parse(JSON.stringify(initial)));
  const [activeTab,  setActiveTab]  = useState<Tab>('metadata');
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const sorted = [...draft.sections].sort((a, b) => a.position - b.position);

  function updateSection(id: string, patch: Partial<OfferTemplateSection>) {
    setDraft(d => ({
      ...d,
      sections: d.sections.map(s => s.id === id ? { ...s, ...patch } : s),
    }));
  }

  function moveSection(id: string, dir: 1 | -1) {
    const list  = [...sorted];
    const idx   = list.findIndex(s => s.id === id);
    if (idx === -1) return;
    const next  = idx + dir;
    if (next < 0 || next >= list.length) return;
    const aPos  = list[idx].position;
    const bPos  = list[next].position;
    setDraft(d => ({
      ...d,
      sections: d.sections.map(s => {
        if (s.id === list[idx].id)  return { ...s, position: bPos };
        if (s.id === list[next].id) return { ...s, position: aPos };
        return s;
      }),
    }));
  }

  function addSection(type: SectionType) {
    const label  = SECTION_TYPE_LABELS[type];
    const maxPos = sorted.length > 0 ? Math.max(...sorted.map(s => s.position)) : 0;
    const newSec: OfferTemplateSection = {
      id:              crypto.randomUUID(),
      type,
      title_en:        label.en,
      title_ar:        label.ar,
      position:        maxPos + 1,
      is_fixed:        label.fixed,
      default_content: '',
    };
    setDraft(d => ({ ...d, sections: [...d.sections, newSec] }));
    setShowPicker(false);
  }

  function removeSection(id: string) {
    setDraft(d => ({ ...d, sections: d.sections.filter(s => s.id !== id) }));
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateTemplate(draft.id, {
        name_en:        draft.name_en,
        name_ar:        draft.name_ar,
        description_en: draft.description_en,
        description_ar: draft.description_ar,
        language:       draft.language,
        sections:       draft.sections,
        version:        initial.version + 1,
      });
      onClose();
    } catch (e: any) {
      setSaveError(e?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Tabs ───────────────────────────────────────────────────────────────────

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'metadata', label: 'Template Info', icon: <Settings size={15} /> },
    { id: 'sections', label: `Sections (${draft.sections.length})`, icon: <Layers size={15} /> },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close editor"
          >
            <X size={18} />
          </button>
          <div>
            <h1 className="font-bold text-slate-900 text-base leading-tight">
              {draft.name_en || 'Untitled Template'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Template editor · v{initial.version}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveError && (
            <p className="text-xs text-red-500">{saveError}</p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            {saving
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Save size={15} />}
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-52 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 p-3 space-y-0.5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-violet-600' : 'text-slate-400'}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">

            {/* ── Metadata tab ────────────────────────────────────────── */}
            {activeTab === 'metadata' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
                  Template Information
                </h2>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Name (EN) <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={draft.name_en}
                      onChange={e => setDraft(d => ({ ...d, name_en: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                      placeholder="e.g. Software Development Proposal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5" dir="rtl">
                      الاسم (AR)
                    </label>
                    <input
                      value={draft.name_ar}
                      onChange={e => setDraft(d => ({ ...d, name_ar: e.target.value }))}
                      dir="rtl"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                      placeholder="مثال: عرض تطوير برمجيات"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description (EN)</label>
                    <textarea
                      value={draft.description_en}
                      onChange={e => setDraft(d => ({ ...d, description_en: e.target.value }))}
                      rows={3}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none"
                      placeholder="Short description of when to use this template..."
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5" dir="rtl">
                      الوصف (AR)
                    </label>
                    <textarea
                      value={draft.description_ar}
                      onChange={e => setDraft(d => ({ ...d, description_ar: e.target.value }))}
                      dir="rtl"
                      rows={2}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Default language</label>
                    <select
                      value={draft.language}
                      onChange={e => setDraft(d => ({ ...d, language: e.target.value as OfferLanguage }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 bg-white"
                    >
                      <option value="en">English</option>
                      <option value="ar">عربي</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <div className="bg-slate-50 rounded-lg px-4 py-2.5 text-xs text-slate-500 w-full">
                      <span className="font-medium text-slate-700">
                        {draft.sections.length}
                      </span>{' '}
                      section{draft.sections.length !== 1 ? 's' : ''} configured
                      {' · '}
                      Saving will bump to v{initial.version + 1}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Sections tab ─────────────────────────────────────────── */}
            {activeTab === 'sections' && (
              <div className="space-y-4">

                {/* Section list */}
                {sorted.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                    <Layers size={24} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">
                      No sections yet. Use the button below to add section types.
                    </p>
                  </div>
                ) : (
                  sorted.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                    >
                      {/* Section header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-mono w-5 text-right">{idx + 1}</span>
                          <span className="text-xs font-semibold text-slate-700">
                            {SECTION_TYPE_LABELS[sec.type]?.en}
                          </span>
                          {sec.is_fixed && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                              Fixed
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveSection(sec.id, -1)}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors"
                            aria-label="Move up"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            onClick={() => moveSection(sec.id, 1)}
                            disabled={idx === sorted.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors"
                            aria-label="Move down"
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button
                            onClick={() => removeSection(sec.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors ml-1"
                            aria-label="Remove section"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Section fields */}
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Title (EN)</label>
                            <input
                              value={sec.title_en}
                              onChange={e => updateSection(sec.id, { title_en: e.target.value })}
                              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1" dir="rtl">
                              العنوان (AR)
                            </label>
                            <input
                              value={sec.title_ar}
                              onChange={e => updateSection(sec.id, { title_ar: e.target.value })}
                              dir="rtl"
                              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">
                            Default content
                            <span className="ml-1.5 text-slate-400 font-normal">
                              (pre-filled when offer is created from this template)
                            </span>
                          </label>
                          <textarea
                            value={sec.default_content}
                            onChange={e => updateSection(sec.id, { default_content: e.target.value })}
                            rows={4}
                            dir={draft.language === 'ar' ? 'rtl' : 'ltr'}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 resize-y font-mono"
                            placeholder="Leave empty if this section should start blank..."
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Add section */}
                <div className="relative">
                  <button
                    onClick={() => setShowPicker(p => !p)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-violet-300 text-violet-600 text-sm font-medium hover:bg-violet-50 transition-colors w-full justify-center"
                  >
                    <Plus size={15} />
                    Add Section
                  </button>

                  {showPicker && (
                    <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-10 p-3 max-h-72 overflow-y-auto">
                      <p className="text-xs font-semibold text-slate-400 mb-2 px-1">Select section type</p>
                      <div className="grid grid-cols-2 gap-1">
                        {ALL_SECTION_TYPES.map(type => {
                          const label = SECTION_TYPE_LABELS[type];
                          return (
                            <button
                              key={type}
                              onClick={() => addSection(type)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors text-left"
                            >
                              {label.fixed && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                              )}
                              <span>{label.en}</span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-slate-400 mt-2 px-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1" />
                        Fixed sections cannot be removed from offers.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
