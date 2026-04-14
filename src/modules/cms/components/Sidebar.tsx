import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Settings, Globe, Briefcase, FileCode2, ChevronLeft, ChevronRight, LogOut, Database } from 'lucide-react';
import { useLang, t } from '../context/LanguageContext';
import { cn } from '../../finance/lib/utils';
import { signOut } from 'firebase/auth';
import { auth } from '../../../core/firebase';
import { useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const { lang, setLang } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isRTL = lang === 'ar';

  const navItems = [
    { id: '',               label_ar: '\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645',            label_en: 'Dashboard',           icon: LayoutDashboard },
    { id: 'contracts',      label_ar: '\u0627\u0644\u0639\u0642\u0648\u062f',                                       label_en: 'Contracts',            icon: FileText },
    { id: 'templates',      label_ar: '\u0642\u0648\u0627\u0644\u0628 \u0627\u0644\u0639\u0642\u0648\u062f',       label_en: 'Templates',            icon: FileCode2 },
    { id: 'projects',       label_ar: '\u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639',                          label_en: 'Projects',             icon: Briefcase },
    { id: 'clients',        label_ar: '\u0627\u0644\u0639\u0645\u0644\u0627\u0621',                                label_en: 'Clients',              icon: Users },
    { id: 'settings',       label_ar: '\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0639\u0642\u0648\u062f', label_en: 'Contract Settings',    icon: Settings },
    { id: 'global-settings',label_ar: '\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0639\u0627\u0645\u0629', label_en: 'Platform Settings', icon: Globe, highlight: true },
  ];

  const handleLogout = async () => {
    try { await signOut(auth); navigate('/login'); }
    catch (error) { console.error('Failed to log out', error); }
  };

  return (
    <div
      className={cn(
        'bg-slate-900 text-white flex flex-col shrink-0 no-print transition-all duration-200',
        isCollapsed ? 'w-20' : 'w-64'
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        {!isCollapsed && (
          <div>
            <h1 className="text-base font-bold text-emerald-400 leading-tight">
              {t('\u0646\u0638\u0627\u0645 \u0627\u0644\u0639\u0642\u0648\u062f', 'Contracts', lang)}
            </h1>
            <p className="text-xs text-slate-400">{t('\u062f\u0631\u0627\u064a\u0629 \u0627\u0644\u0630\u0643\u064a\u0629', 'Diraya Smart', lang)}</p>
          </div>
        )}
        {isCollapsed && <span className="text-base font-bold text-emerald-400 mx-auto">CMS</span>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          {isCollapsed
            ? (isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />)
            : (isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />)}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const path = `/cms${item.id ? `/${item.id}` : ''}`;
          const isActive = location.pathname === path || (item.id === '' && location.pathname === '/cms');
          const isGlobal = !!item.highlight;
          const label = t(item.label_ar, item.label_en, lang);
          return (
            <Link
              key={item.id}
              to={path}
              title={isCollapsed ? label : undefined}
              className={cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-emerald-600 text-white'
                  : isGlobal
                    ? 'text-emerald-400 hover:bg-emerald-900/20 border border-emerald-800/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                isCollapsed ? 'justify-center' : ''
              )}
            >
              <Icon
                size={20}
                className={cn(
                  'flex-shrink-0',
                  isActive ? 'text-white' : isGlobal ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white',
                  !isCollapsed && (isRTL ? 'ml-3' : 'mr-3')
                )}
              />
              {!isCollapsed && label}
            </Link>
          );
        })}

        {/* Admin separator */}
        {!isCollapsed && (
          <div className="pt-3 pb-1">
            <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t('\u0623\u062f\u0648\u0627\u062a', 'Admin', lang)}
            </p>
          </div>
        )}
        {isCollapsed && <div className="border-t border-slate-700 my-2" />}

        {/* Seed link */}
        <Link
          to="/cms/admin/seed"
          title={isCollapsed ? t('\u0625\u0639\u062f\u0627\u062f \u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a', 'Seed Database', lang) : undefined}
          className={cn(
            'group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors',
            location.pathname === '/cms/admin/seed'
              ? 'bg-amber-600 text-white'
              : 'text-amber-400 hover:bg-amber-900/20 border border-amber-800/30',
            isCollapsed ? 'justify-center' : ''
          )}
        >
          <Database
            size={20}
            className={cn(
              'flex-shrink-0',
              location.pathname === '/cms/admin/seed' ? 'text-white' : 'text-amber-400',
              !isCollapsed && (isRTL ? 'ml-3' : 'mr-3')
            )}
          />
          {!isCollapsed && t('\u0625\u0639\u062f\u0627\u062f \u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a', 'Seed Database', lang)}
        </Link>
      </nav>

      {/* Footer: lang toggle + logout */}
      <div className="border-t border-slate-800 p-4 space-y-3">
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          title={isCollapsed ? (lang === 'ar' ? 'English' : '\u0639\u0631\u0628\u064a') : undefined}
          className={cn(
            'w-full flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors',
            isCollapsed ? 'justify-center' : 'space-x-2 space-x-reverse'
          )}
        >
          <Globe size={18} className={cn('flex-shrink-0', !isCollapsed && (isRTL ? 'ml-2' : 'mr-2'))} />
          {!isCollapsed && <span>{lang === 'ar' ? 'English' : '\u0639\u0631\u0628\u064a'}</span>}
        </button>

        <button
          onClick={handleLogout}
          title={isCollapsed ? t('\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c', 'Sign out', lang) : undefined}
          className={cn(
            'w-full flex items-center px-2 py-2 text-sm font-medium text-red-400 rounded-md hover:bg-slate-800 transition-colors',
            isCollapsed ? 'justify-center' : ''
          )}
        >
          <LogOut size={18} className={cn('flex-shrink-0', !isCollapsed && (isRTL ? 'ml-3' : 'mr-3'))} />
          {!isCollapsed && t('\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c', 'Sign out', lang)}
        </button>
      </div>
    </div>
  );
}
