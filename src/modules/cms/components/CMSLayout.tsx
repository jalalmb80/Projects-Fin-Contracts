import React from 'react';
import { Outlet } from 'react-router-dom';
import { LanguageProvider } from '../context/LanguageContext';
import { SettingsProvider } from '../context/SettingsContext';
import Sidebar from './Sidebar';

export default function CMSLayout() {
  return (
    <LanguageProvider>
      <SettingsProvider>
        <div className="flex h-full w-full" dir="rtl">
          <Sidebar />
          <div className="flex-1 overflow-y-auto bg-slate-50">
            <Outlet />
          </div>
        </div>
      </SettingsProvider>
    </LanguageProvider>
  );
}
