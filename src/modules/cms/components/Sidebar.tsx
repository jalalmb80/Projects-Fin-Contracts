import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Settings, Globe, Briefcase, FileCode2, ChevronLeft, ChevronRight, LogOut, Database } from 'lucide-react';
import { useLang, t } from '../context/LanguageContext';
import { cn } from '../../finance/lib/utils';
import { signOut } from 'firebase/auth';
import { auth } from '../../../core/firebase';

export default function Sidebar() {
  const { lang, setLang } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isRTL = lang === 'ar';

  // Platform Settings (/settings) is in the platform sidebar (ModuleSwitcher).
  // It is intentionally NOT duplicated here.
  const navItems = [
    { id: '',          label_ar: 'لوحة التحكم',              label_en: 'Dashboard',         icon: LayoutDashboard },
    { id: 'contracts', label_ar: 'العقود',                           label_en: 'Contracts',         icon: FileText },
    { id: 'templates', label_ar: 'قوالب العقود',           label_en: 'Templates',         icon: FileCode2 },
    { id: 'projects',  label_ar: 'المشاريع',                          label_en: 'Projects',          icon: Briefcase },
    { id: 'clients',   label_ar: 'العملاء',                              label_en: 'Clients',           icon: Users },
    { id: 'settings',  label_ar: 'إعدادات العقود',         label_en: 'Contract Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try { await signOut(auth); navigate('/login'); }
    catch (err) { console.error('Failed to log out', err); }
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
            <h1 className="text-base font-bold text-emerald-400 leading-tight">{t('نظام العقود', 'Contracts', lang)}</h1>
            <p className="text-xs text-slate-400">{t('دراية الذكية', 'Diraya Smart', lang)}</p>
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
          const label = t(item.label_ar, item.label_en, lang);
          return (
            <Link
              key={item.id}
              to={path}
              title={isCollapsed ? label : undefined}
              className={cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                isCollapsed ? 'justify-center' : ''
              )}
            >
              <Icon
                size={20}
                className={cn(
                  'flex-shrink-0',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-white',
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
            <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('أدوات', 'Admin', lang)}</p>
          </div>
        )}
        {isCollapsed && <div className="border-t border-slate-700 my-2" />}

        <Link
          to="/cms/admin/seed"
          title={isCollapsed ? t('إعداد قاعدة البيانات', 'Seed Database', lang) : undefined}
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
          {!isCollapsed && t('إعداد قاعدة البيانات', 'Seed Database', lang)}
        </Link>
      </nav>

      {/* Footer: lang toggle + logout */}
      <div className="border-t border-slate-800 p-4 space-y-3">
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          title={isCollapsed ? (lang === 'ar' ? 'English' : 'عربي') : undefined}
          className={cn(
            'w-full flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors',
            isCollapsed ? 'justify-center' : 'space-x-2 space-x-reverse'
          )}
        >
          <Globe size={18} className={cn('flex-shrink-0', !isCollapsed && (isRTL ? 'ml-2' : 'mr-2'))} />
          {!isCollapsed && <span>{lang === 'ar' ? 'English' : 'عربي'}</span>}
        </button>

        <button
          onClick={handleLogout}
          title={isCollapsed ? t('تسجيل الخروج', 'Sign out', lang) : undefined}
          className={cn(
            'w-full flex items-center px-2 py-2 text-sm font-medium text-red-400 rounded-md hover:bg-slate-800 transition-colors',
            isCollapsed ? 'justify-center' : ''
          )}
        >
          <LogOut size={18} className={cn('flex-shrink-0', !isCollapsed && (isRTL ? 'ml-3' : 'mr-3'))} />
          {!isCollapsed && t('تسجيل الخروج', 'Sign out', lang)}
        </button>
      </div>
    </div>
  );
}
