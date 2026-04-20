import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { FileText, LayoutDashboard, Layers, Settings, ChevronLeft } from 'lucide-react';
import { usePlatform } from '../../../core/context/PlatformContext';

const NAV = [
  { to: '/offers',           icon: LayoutDashboard, label: 'Dashboard',  labelAr: '\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645', end: true },
  { to: '/offers/list',      icon: FileText,        label: 'Offers',     labelAr: '\u0627\u0644\u0639\u0631\u0648\u0636' },
  { to: '/offers/templates', icon: Layers,          label: 'Templates',  labelAr: '\u0627\u0644\u0642\u0648\u0627\u0644\u0628' },
];

export default function OffersLayout() {
  const { user } = usePlatform();

  if (!user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-slate-400 text-sm">Not authenticated</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <FileText size={14} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">Offers</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-violet-50 text-violet-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <div className="px-3 py-2 text-xs text-slate-400">
            {user.email}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
