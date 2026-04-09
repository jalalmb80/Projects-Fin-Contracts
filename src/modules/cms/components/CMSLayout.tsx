import React from 'react';
import { Outlet } from 'react-router-dom';
import { LanguageProvider, useLang } from '../context/LanguageContext';
import { SettingsProvider, useSettings } from '../context/SettingsContext';
import Sidebar from './Sidebar';

function CMSLayoutInner() {
  const { settingsLoading } = useSettings();
  const { lang } = useLang();
  const isRTL = lang === 'ar';

  if (settingsLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50" dir="rtl">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0645\u064a\u0644...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* In LTR (English), sidebar is first child \u2192 renders on the left naturally */}
      {!isRTL && <Sidebar />}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <Outlet />
      </div>
      {/* In RTL (Arabic), sidebar is last child in DOM but flex-direction is row-reverse \u2192 renders on right */}
      {isRTL && <Sidebar />}
    </div>
  );
}

export default function CMSLayout() {
  return (
    <LanguageProvider>
      <SettingsProvider>
        <CMSLayoutInner />
      </SettingsProvider>
    </LanguageProvider>
  );
}
