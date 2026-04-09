import React from 'react';
import { Outlet } from 'react-router-dom';
import { LanguageProvider } from '../context/LanguageContext';
import { SettingsProvider, useSettings } from '../context/SettingsContext';
import Sidebar from './Sidebar';

function CMSLayoutInner() {
  const { settingsLoading } = useSettings();

  if (settingsLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50" dir="rtl">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">جارٍ التحميل...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full" dir="rtl">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <Outlet />
      </div>
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
