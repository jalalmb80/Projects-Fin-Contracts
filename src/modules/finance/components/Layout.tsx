import React, { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLang, t } from '../context/LanguageContext';
import {
  LayoutDashboard, Briefcase, FileText, Repeat, Users, Settings, LogOut,
  Menu, X, CreditCard, Package, Bell, Moon, Sun, ChevronLeft, ChevronRight, Globe
} from 'lucide-react';
import { cn } from '../lib/utils';
import { signOut } from 'firebase/auth';
import { auth } from '../../../core/firebase';
import { DocumentStatus, DocumentDirection, Currency } from '../types';
import { format } from 'date-fns';

export default function Layout() {
  const { user, billingDocuments, displayCurrency, setDisplayCurrency } = useApp();
  const { lang, setLang } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Platform Settings (/settings) is in the platform sidebar (ModuleSwitcher).
  // It is intentionally NOT duplicated here.
  const navigation = [
    { name_en: 'Dashboard',      name_ar: 'لوحة التحكم',              href: '/finance/dashboard',      icon: LayoutDashboard },
    { name_en: 'Projects',       name_ar: 'المشاريع',                       href: '/finance/projects',       icon: Briefcase },
    { name_en: 'Subscriptions',  name_ar: 'الاشتراكات',              href: '/finance/subscriptions',  icon: Repeat },
    { name_en: 'Billing',        name_ar: 'الفواتير',                      href: '/finance/billing',        icon: FileText },
    { name_en: 'Payments',       name_ar: 'المدفوعات',                   href: '/finance/payments',       icon: CreditCard },
    { name_en: 'Counterparties', name_ar: 'العملاء والموردين',     href: '/finance/counterparties', icon: Users },
    { name_en: 'Products',       name_ar: 'المنتجات',                      href: '/finance/products',       icon: Package },
    { name_en: 'Settings',       name_ar: 'الإعدادات',                   href: '/finance/settings',       icon: Settings },
  ];

  const handleLogout = async () => {
    try { await signOut(auth); navigate('/login'); }
    catch (err) { console.error('Failed to log out', err); }
  };

  const overdueCount = billingDocuments.filter(d =>
    d.direction === DocumentDirection.AR && d.status === DocumentStatus.Overdue
  ).length;

  const toggleCurrency = () =>
    setDisplayCurrency(displayCurrency === Currency.SAR ? Currency.USD : Currency.SAR);

  const toggleDarkMode = () => document.documentElement.classList.toggle('dark');

  const isRTL = lang === 'ar';

  return (
    <div className="min-h-screen bg-slate-50 flex" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Mobile menu toggle */}
      <div className={cn('lg:hidden fixed top-4 z-50', isRTL ? 'right-4' : 'left-4')}>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md bg-slate-900 shadow-md text-slate-300 hover:text-white">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 z-40 bg-slate-900 border-slate-800 transform transition-all duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:flex lg:flex-col',
        isRTL ? 'right-0 border-l' : 'left-0 border-r',
        isMobileMenuOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full'),
        isSidebarCollapsed ? 'w-20' : 'w-64'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          {!isSidebarCollapsed && <h1 className="text-xl font-bold text-white truncate">FinArchiTec</h1>}
          {isSidebarCollapsed && <h1 className="text-xl font-bold text-white mx-auto">FA</h1>}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:block p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white">
            {isSidebarCollapsed
              ? (isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />)
              : (isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />)}
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-1">
            {navigation.map(item => {
              const isActive = location.pathname.startsWith(item.href);
              const itemName = t(item.name_ar, item.name_en, lang);
              return (
                <Link key={item.name_en} to={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                    isSidebarCollapsed ? 'justify-center' : ''
                  )}
                  title={isSidebarCollapsed ? itemName : undefined}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className={cn(
                    'flex-shrink-0 h-5 w-5',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white',
                    !isSidebarCollapsed && (isRTL ? 'ml-3' : 'mr-3')
                  )} />
                  {!isSidebarCollapsed && itemName}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer: user + lang toggle + logout */}
        <div className="border-t border-slate-800 p-4 space-y-3">
          {!isSidebarCollapsed ? (
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {user?.photoURL
                  ? <img className="h-8 w-8 rounded-full" src={user.photoURL} alt="" />
                  : <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-indigo-400 font-bold">{user?.email?.charAt(0).toUpperCase()}</div>}
              </div>
              <div className={cn('overflow-hidden', isRTL ? 'mr-3' : 'ml-3')}>
                <p className="text-sm font-medium text-slate-300 truncate">{user?.displayName || user?.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-indigo-400 font-bold">{user?.email?.charAt(0).toUpperCase()}</div>
            </div>
          )}

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className={cn(
              'w-full flex items-center px-2 py-2 text-sm font-medium text-slate-300 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors',
              isSidebarCollapsed ? 'justify-center' : 'space-x-2 space-x-reverse'
            )}
            title={isSidebarCollapsed ? (lang === 'ar' ? 'English' : 'عربي') : undefined}
          >
            <Globe className={cn('h-5 w-5 flex-shrink-0', !isSidebarCollapsed && (isRTL ? 'ml-2' : 'mr-2'))} />
            {!isSidebarCollapsed && <span>{lang === 'ar' ? 'English' : 'عربي'}</span>}
          </button>

          {/* Logout */}
          <button onClick={handleLogout}
            className={cn('w-full flex items-center px-2 py-2 text-sm font-medium text-red-400 rounded-md hover:bg-slate-800 transition-colors', isSidebarCollapsed ? 'justify-center' : '')}
            title={t('تسجيل الخروج', 'Sign out', lang)}>
            <LogOut className={cn('h-5 w-5', !isSidebarCollapsed && (isRTL ? 'ml-3' : 'mr-3'))} />
            {!isSidebarCollapsed && t('تسجيل الخروج', 'Sign out', lang)}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-medium text-slate-900">
            {(() => {
              const match = navigation.find(n => location.pathname.startsWith(n.href));
              return match ? t(match.name_ar, match.name_en, lang) : t('لوحة التحكم', 'Dashboard', lang);
            })()}
          </h2>
          <div className="flex items-center space-x-4 space-x-reverse">
            <span className="whitespace-nowrap text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm px-4 py-2">
              {format(new Date(), lang === 'ar' ? 'd MMMM yyyy' : 'MMMM d, yyyy')}
            </span>
            <button onClick={toggleCurrency} className="px-3 py-1 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200">
              {displayCurrency}
            </button>
            <button onClick={toggleDarkMode} className="p-1 text-slate-500 hover:text-slate-700">
              {document.documentElement.classList.contains('dark') ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="relative">
              <Bell size={20} className="text-slate-500" />
              {overdueCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                  {overdueCount}
                </span>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
