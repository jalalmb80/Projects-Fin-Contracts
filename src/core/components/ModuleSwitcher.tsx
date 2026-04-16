import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, ScrollText, Users, Settings, LogOut } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { MODULES } from '../registry';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  TrendingUp,
  ScrollText,
};

// Platform-level nav entries that live outside any module
const PLATFORM_NAV = [
  { path: '/clients',  icon: Users,    title: '\u062f\u0644\u064a\u0644 \u0627\u0644\u0639\u0645\u0644\u0627\u0621' },
  { path: '/settings', icon: Settings, title: '\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a' },
];

export default function ModuleSwitcher() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = usePlatform();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const btnBase = 'w-10 h-10 rounded-xl flex items-center justify-center transition-all';
  const btnIdle = `${btnBase} bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white`;
  const btnActive = (color?: string) =>
    `${btnBase} text-white shadow-lg`;

  return (
    <div className="w-16 bg-slate-900 flex flex-col items-center py-4 gap-2 border-r border-slate-800 z-50">

      {/* Platform logo */}
      <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center mb-2">
        <span className="text-white font-black text-sm">DP</span>
      </div>

      {/* ── Divider ── */}
      <div className="w-6 h-px bg-slate-700 my-1" />

      {/* Module icons (Finance, CMS, …) */}
      {MODULES.filter(m => m.enabled).map(mod => {
        const Icon     = ICON_MAP[mod.icon] || TrendingUp;
        const isActive = location.pathname.startsWith(mod.basePath);
        return (
          <button
            key={mod.id}
            onClick={() => navigate(mod.basePath)}
            title={mod.name}
            className={isActive ? btnActive(mod.color) : btnIdle}
            style={isActive ? { backgroundColor: mod.color } : {}}
          >
            <Icon size={20} />
          </button>
        );
      })}

      {/* ── Divider ── */}
      <div className="w-6 h-px bg-slate-700 my-1" />

      {/* Platform-level pages: Clients directory + Settings */}
      {PLATFORM_NAV.map(({ path, icon: Icon, title }) => {
        const isActive = location.pathname.startsWith(path);
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            title={title}
            className={isActive ? `${btnBase} bg-emerald-600 text-white shadow-lg` : btnIdle}
          >
            <Icon size={20} />
          </button>
        );
      })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* User avatar */}
      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-bold mb-1">
        {user?.email?.charAt(0).toUpperCase()}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        title="Sign out"
        className="w-10 h-10 rounded-xl bg-slate-800 text-red-400 hover:bg-red-900 hover:text-red-300 flex items-center justify-center transition-all"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}
