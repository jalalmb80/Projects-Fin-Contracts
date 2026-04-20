import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { OfferSection, OfferLanguage } from '../types';
import PricingSection from './PricingSection';
import { Offer } from '../types';

interface Props {
  section: OfferSection | null;
  offer: Offer;
  language: OfferLanguage;
  readOnly: boolean;
  onContentChange: (sectionId: string, content: string) => void;
  onTitleChange: (sectionId: string, title: string) => void;
  onSaveLineItems: (items: import('../types').LineItem[], discountPct: number, vatRate: number) => Promise<void>;
}

export default function SectionEditor({
  section, offer, language, readOnly,
  onContentChange, onTitleChange, onSaveLineItems,
}: Props) {
  const [localContent, setLocalContent] = useState('');
  const [localTitle,   setLocalTitle]   = useState('');
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (!section) return;
    setLocalContent(section.content);
    setLocalTitle(language === 'ar' ? section.title_ar : section.title_en);
  }, [section?.id, language]);

  if (!section) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <p className="text-sm">Select a section to edit</p>
      </div>
    );
  }

  if (section.type === 'pricing_table') {
    return (
      <PricingSection
        offer={offer}
        readOnly={readOnly}
        onSave={onSaveLineItems}
      />
    );
  }

  return (
    <div className="flex flex-col h-full p-6 gap-4" dir={dir}>
      {/* Section title */}
      <div className="flex items-center gap-2">
        {section.is_fixed && (
          <Lock size={14} className="text-slate-400 flex-shrink-0" />
        )}
        <input
          type="text"
          value={localTitle}
          disabled={readOnly || section.is_fixed}
          onChange={e => setLocalTitle(e.target.value)}
          onBlur={() => onTitleChange(section.id, localTitle)}
          className="flex-1 text-lg font-semibold text-slate-900 bg-transparent border-0 border-b border-transparent focus:border-violet-300 focus:outline-none pb-1 transition-colors disabled:cursor-default"
          placeholder="Section title"
        />
      </div>

      {section.is_fixed && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          This is a fixed section. Some fields may be locked.
        </p>
      )}

      {/* Content */}
      <textarea
        value={localContent}
        disabled={readOnly}
        onChange={e => setLocalContent(e.target.value)}
        onBlur={() => onContentChange(section.id, localContent)}
        dir={dir}
        className="flex-1 resize-none text-sm text-slate-800 bg-white border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 leading-relaxed disabled:bg-slate-50 disabled:cursor-default"
        placeholder={language === 'ar' ? '\u0627\u0643\u062a\u0628 \u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u0642\u0633\u0645...' : 'Write section content...'}
      />
    </div>
  );
}
