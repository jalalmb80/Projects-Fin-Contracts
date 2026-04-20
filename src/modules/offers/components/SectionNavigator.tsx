import React from 'react';
import { Lock, ChevronUp, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { OfferSection, SectionType, SECTION_TYPE_LABELS, OfferLanguage } from '../types';

interface Props {
  sections: OfferSection[];
  activeSectionId: string | null;
  language: OfferLanguage;
  onSelect: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onRemove: (id: string) => void;
  onAddSection: (type: SectionType) => void;
}

const ADDABLE_TYPES: SectionType[] = [
  'scope_of_work', 'technical_approach', 'team_profiles',
  'project_timeline', 'pricing_table', 'payment_schedule',
  'case_studies', 'deliverables', 'faq', 'company_profile', 'custom_rich_text',
];

export default function SectionNavigator({
  sections, activeSectionId, language,
  onSelect, onMoveUp, onMoveDown, onRemove, onAddSection,
}: Props) {
  const [showAddMenu, setShowAddMenu] = React.useState(false);
  const sorted = [...sections].sort((a, b) => a.position - b.position);

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
      <div className="px-3 py-3 border-b border-slate-200">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sections</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sorted.map((sec, idx) => {
          const label = SECTION_TYPE_LABELS[sec.type];
          const title = language === 'ar' ? sec.title_ar : sec.title_en;
          const isActive = sec.id === activeSectionId;

          return (
            <div
              key={sec.id}
              className={`group flex items-center gap-1.5 rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${
                isActive ? 'bg-violet-100 text-violet-800' : 'hover:bg-white text-slate-700'
              }`}
              onClick={() => onSelect(sec.id)}
            >
              {sec.is_fixed ? (
                <Lock size={11} className="flex-shrink-0 text-slate-400" aria-label="Fixed section" />
              ) : (
                <span className="flex-shrink-0 w-3 text-slate-300 text-xs select-none">\u283f</span>
              )}
              <span className="flex-1 text-xs truncate">{title || label.en}</span>

              {!sec.is_fixed && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => { e.stopPropagation(); onMoveUp(sec.id); }}
                    disabled={idx === 0}
                    className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-30"
                    aria-label="Move section up"
                  >
                    <ChevronUp size={10} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); onMoveDown(sec.id); }}
                    disabled={idx === sorted.length - 1}
                    className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-30"
                    aria-label="Move section down"
                  >
                    <ChevronDown size={10} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); onRemove(sec.id); }}
                    className="p-0.5 rounded hover:bg-red-100 hover:text-red-600"
                    aria-label="Remove section"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add section */}
      <div className="p-2 border-t border-slate-200 relative">
        <button
          onClick={() => setShowAddMenu(v => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-slate-300 text-xs text-slate-500 hover:border-violet-400 hover:text-violet-600 transition-colors"
        >
          <Plus size={12} /> Add section
        </button>

        {showAddMenu && (
          <div className="absolute bottom-12 left-2 right-2 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-56 overflow-y-auto">
            {ADDABLE_TYPES.map(type => (
              <button
                key={type}
                onClick={() => { onAddSection(type); setShowAddMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-violet-50 hover:text-violet-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                {SECTION_TYPE_LABELS[type].en}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
