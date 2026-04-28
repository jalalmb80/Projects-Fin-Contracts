import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { FileText, LayoutDashboard, Layers } from 'lucide-react';
import { usePlatform } from '../../../core/context/PlatformContext';
import { OffersProvider } from '../context/OffersContext';

const NAV = [
  { to: '/offers',           icon: LayoutDashboard, label: 'Dashboard',  end: true },
  { to: '/offers/list',      icon: FileText,        label: 'Offers'           },
  { to: '/offers/templates', icon: Layers,          label: 'Templates'        },
];

function OffersLayoutInner() {
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
          {/* Footer slot — intentionally minimal */}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default function OffersLayout() {
  const { user } = usePlatform();

  if (!user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-slate-400 text-sm">Not authenticated</p>
      </div>
    );
  }

  // OffersProvider runs useOffers() exactly once here — all child pages
  // consume via useOffersContext() without opening duplicate listeners.
  return (
    <OffersProvider>
      <OffersLayoutInner />
    </OffersProvider>
  );
}
