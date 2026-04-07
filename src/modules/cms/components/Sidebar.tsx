import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Settings, Globe, Briefcase, FileCode2 } from 'lucide-react';
import { useLang, t } from '../context/LanguageContext';

export default function Sidebar() {
  const { lang, setLang } = useLang();
  const location = useLocation();

  const navItems = [
    { id: '', label_ar: 'لوحة التحكم', label_en: 'Dashboard', icon: LayoutDashboard },
    { id: 'contracts', label_ar: 'العقود', label_en: 'Contracts', icon: FileText },
    { id: 'templates', label_ar: 'قوالب العقود', label_en: 'Templates', icon: FileCode2 },
    { id: 'projects', label_ar: 'المشاريع', label_en: 'Projects', icon: Briefcase },
    { id: 'clients', label_ar: 'العملاء', label_en: 'Clients', icon: Users },
    { id: 'settings', label_ar: 'الإعدادات', label_en: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col shrink-0 no-print">
      <div className="p-6">
        <h1 className="text-xl font-bold text-emerald-400">{t('نظام إدارة العقود', 'Contract Management', lang)}</h1>
        <p className="text-sm text-slate-400 mt-1">{t('دراية الذكية', 'Diraya Smart', lang)}</p>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const path = `/cms${item.id ? `/${item.id}` : ''}`;
          const isActive = location.pathname === path || (item.id === '' && location.pathname === '/cms');
          return (
            <Link
              key={item.id}
              to={path}
              className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
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
          <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
        </button>
      </div>
    </div>
  );
}
