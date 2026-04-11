import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLang, t } from '../context/LanguageContext';

export default function CMSSettingsPage() {
  const { lang } = useLang();
  const isRTL = lang === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="p-8 space-y-6 max-w-3xl" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-slate-800">{t('\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0639\u0642\u0648\u062f', 'Contract Settings', lang)}</h1>

      <Link to="/cms/global-settings"
        className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-5 hover:bg-emerald-100 transition-colors group">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0"><Globe size={22} className="text-white"/></div>
          <div>
            <p className="font-bold text-emerald-800 text-lg">{t('\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0639\u0627\u0645\u0629 \u0644\u0644\u0645\u0646\u0635\u0629', 'Platform Settings', lang)}</p>
            <p className="text-sm text-emerald-600 mt-1">{t('\u0627\u0644\u0643\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629\u060c \u0627\u0644\u0634\u0639\u0627\u0631\u060c \u0627\u0644\u0623\u0644\u0648\u0627\u0646\u060c \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0628\u0646\u0643\u064a\u0629 \u2014 \u0645\u0634\u062a\u0631\u0643\u0629 \u0645\u0639 \u0648\u062d\u062f\u0629 \u0627\u0644\u0645\u0627\u0644\u064a\u0629', 'Company entities, logo, brand colors, bank details \u2014 shared with Finance module', lang)}</p>
          </div>
        </div>
        <ArrowIcon size={22} className="text-emerald-500 group-hover:translate-x-1 transition-transform shrink-0"/>
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
        <h2 className="text-base font-semibold text-slate-700">{t('\u0645\u0627 \u062a\u0645 \u0646\u0642\u0644\u0647 \u0625\u0644\u0649 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0639\u0627\u0645\u0629', 'What moved to Platform Settings', lang)}</h2>
        <ul className="space-y-2 text-sm text-slate-600">
          {[
            [t('\u0643\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0634\u0631\u0643\u0629 (\u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u0623\u0648\u0644)', 'Company entities (Party One)', lang), t('\u062a\u064f\u0633\u062a\u062e\u062f\u0645 \u0641\u064a \u0631\u0623\u0633 \u0627\u0644\u0639\u0642\u0648\u062f \u0648\u062e\u0627\u0646\u0629 \u0627\u0644\u0637\u0631\u0641 \u0627\u0644\u0623\u0648\u0644', 'Used in contract headers and Party One fields', lang)],
            [t('\u0627\u0644\u0634\u0639\u0627\u0631 \u0648\u0627\u0644\u0623\u0644\u0648\u0627\u0646', 'Logo & brand colors', lang), t('\u062a\u064f\u0637\u0628\u064e\u0651\u0642 \u0639\u0644\u0649 \u0645\u0639\u0627\u064a\u0646\u0629 \u0627\u0644\u0639\u0642\u062f \u0648\u0627\u0644\u0637\u0628\u0627\u0639\u0629', 'Applied to contract preview and printing', lang)],
            [t('\u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0628\u0646\u0643\u064a\u0629', 'Bank details', lang), t('IBAN\u060c \u0627\u0633\u0645 \u0627\u0644\u0628\u0646\u0643\u060c \u0635\u0627\u062d\u0628 \u0627\u0644\u062d\u0633\u0627\u0628', 'IBAN, bank name, account holder', lang)],
            [t('\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0645\u062b\u0644', 'Representative details', lang), t('\u0627\u0644\u0627\u0633\u0645 \u0648\u0627\u0644\u0645\u0633\u0645\u0649 \u0627\u0644\u0648\u0638\u064a\u0641\u064a \u0644\u0644\u062a\u0648\u0642\u064a\u0639', 'Name and title for signature block', lang)],
          ].map(([field, desc]) => (
            <li key={field as string} className="flex items-start gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 shrink-0"/>
              <span><strong>{field}</strong> \u2014 {desc}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-3">
        <h2 className="text-base font-semibold text-slate-700">{t('\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0645\u062a\u0628\u0642\u064a\u0629 \u0641\u064a \u0647\u0630\u0647 \u0627\u0644\u0648\u062d\u062f\u0629', 'Settings remaining in this module', lang)}</h2>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2"><span className="w-2 h-2 bg-slate-400 rounded-full mt-1.5 shrink-0"/>
            <span><strong>{t('\u0645\u0639\u062f\u0644 \u0636\u0631\u064a\u0628\u0629 \u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0645\u0636\u0627\u0641\u0629 \u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a', 'Default VAT rate', lang)}</strong>{' \u2014 '}{t('\u0645\u064f\u062f\u0627\u0631 \u0627\u0644\u0622\u0646 \u0645\u0646 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0639\u0627\u0645\u0629 \u0623\u064a\u0636\u0627\u064b', 'Now also managed from Platform Settings', lang)}</span>
          </li>
          <li className="flex items-start gap-2"><span className="w-2 h-2 bg-slate-400 rounded-full mt-1.5 shrink-0"/>
            <span><strong>{t('\u0642\u0648\u0627\u0644\u0628 \u0627\u0644\u0639\u0642\u0648\u062f', 'Contract templates', lang)}</strong>{' \u2014 '}{t('\u062a\u064f\u062f\u0627\u0631 \u0645\u0646 \u0635\u0641\u062d\u0629 \u0627\u0644\u0642\u0648\u0627\u0644\u0628', 'Managed from the Templates page', lang)}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
