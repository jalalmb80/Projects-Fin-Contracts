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
      <h1 className="text-2xl font-bold text-slate-800">{t('إعدادات العقود', 'Contract Settings', lang)}</h1>

      {/* Platform Settings banner — links to /settings in the platform shell */}
      <Link to="/settings"
        className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-5 hover:bg-emerald-100 transition-colors group">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Globe size={22} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-emerald-800 text-lg">{t('إعدادات المنصة', 'Platform Settings', lang)}</p>
            <p className="text-sm text-emerald-600 mt-1">{t(
              'الكيانات القانونية، الشعار، الألوان، البيانات البنكية — مشتركة مع وحدة المالية',
              'Company entities, logo, brand colors, bank details — shared with Finance module',
              lang
            )}</p>
          </div>
        </div>
        <ArrowIcon size={22} className="text-emerald-500 group-hover:translate-x-1 transition-transform shrink-0" />
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
        <h2 className="text-base font-semibold text-slate-700">{t('ما تم نقله إلى الإعدادات العامة', 'What moved to Platform Settings', lang)}</h2>
        <ul className="space-y-2 text-sm text-slate-600">
          {[
            [t('كيانات الشركة (الطرف الأول)', 'Company entities (Party One)', lang),   t('تُستخدم في رأس العقود وخانة الطرف الأول', 'Used in contract headers and Party One fields', lang)],
            [t('الشعار والألوان',                  'Logo & brand colors', lang),                t('تُطبَّق على معاينة العقد والطباعة',        'Applied to contract preview and printing', lang)],
            [t('البيانات البنكية',                   'Bank details', lang),                       t('IBAN، اسم البنك، صاحب الحساب',           'IBAN, bank name, account holder', lang)],
            [t('بيانات الممثل',                     'Representative details', lang),               t('الاسم والمسمى الوظيفي للتوقيع',     'Name and title for signature block', lang)],
          ].map(([field, desc]) => (
            <li key={field as string} className="flex items-start gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
              <span><strong>{field}</strong> — {desc}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-3">
        <h2 className="text-base font-semibold text-slate-700">{t('الإعدادات المتبقية في هذه الوحدة', 'Settings remaining in this module', lang)}</h2>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-slate-400 rounded-full mt-1.5 shrink-0" />
            <span><strong>{t('معدل ضريبة القيمة المضافة الافتراضي', 'Default VAT rate', lang)}</strong>{' — '}{t('مُدار من إعدادات العقد مباشرة', 'Managed directly in contract settings', lang)}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-slate-400 rounded-full mt-1.5 shrink-0" />
            <span><strong>{t('قوالب العقود', 'Contract templates', lang)}</strong>{' — '}{t('تُدار من صفحة القوالب', 'Managed from the Templates page', lang)}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
