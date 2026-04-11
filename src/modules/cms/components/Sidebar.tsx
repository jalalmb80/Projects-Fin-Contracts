import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Settings, Globe, Briefcase, FileCode2 } from 'lucide-react';
import { useLang, t } from '../context/LanguageContext';

export default function Sidebar() {
  const { lang, setLang } = useLang();
  const location = useLocation();

  const navItems = [
    { id: '', label_ar: '\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645', label_en: 'Dashboard', icon: LayoutDashboard },
    { id: 'contracts', label_ar: '\u0627\u0644\u0639\u0642\u0648\u062f', label_en: 'Contracts', icon: FileText },
    { id: 'templates', label_ar: '\u0642\u0648\u0627\u0644\u0628 \u0627\u0644\u0639\u0642\u0648\u062f', label_en: 'Templates', icon: FileCode2 },
    { id: 'projects', label_ar: '\u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639', label_en: 'Projects', icon: Briefcase },
    { id: 'clients', label_ar: '\u0627\u0644\u0639\u0645\u0644\u0627\u0621', label_en: 'Clients', icon: Users },
    { id: 'settings', label_ar: '\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0639\u0642\u0648\u062f', label_en: 'Contract Settings', icon: Settings },
    { id: 'global-settings', label_ar: '\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0639\u0627\u0645\u0629', label_en: 'Platform Settings', icon: Globe, highlight: true },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col shrink-0 no-print">
      <div className="p-6">
        <h1 className="text-xl font-bold text-emerald-400">{t('\u0646\u0638\u0627\u0645 \u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0639\u0642\u0648\u062f', 'Contract Management', lang)}</h1>
        <p className="text-sm text-slate-400 mt-1">{t('\u062f\u0631\u0627\u064a\u0629 \u0627\u0644\u0630\u0643\u064a\u0629', 'Diraya Smart', lang)}</p>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const path = `/cms${item.id ? `/${item.id}` : ''}`;
          const isActive = location.pathname === path || (item.id === '' && location.pathname === '/cms');
          const isGlobal = (item as any).highlight;
          return (
            <Link
              key={item.id}
              to={path}
              className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : isGlobal
                    ? 'text-emerald-400 hover:bg-emerald-900/30 border border-emerald-800/40'
                    : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon size={20} />
              <span>{t(item.label_ar, item.label_en, lang)}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800 mt-auto">
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="w-full flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <Globe size={18} />
          <span>{lang === 'ar' ? 'English' : '\u0639\u0631\u0628\u064a'}</span>
        </button>
      </div>
    </div>
  );
}
