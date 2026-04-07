import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, ScrollText, LogOut } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { MODULES } from '../registry';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  TrendingUp,
  ScrollText,
};

export default function ModuleSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = usePlatform();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="w-16 bg-slate-900 flex flex-col items-center py-4 gap-2 border-r border-slate-800 z-50">
      {/* Platform logo */}
      <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center mb-4">
        <span className="text-white font-black text-sm">DP</span>
      </div>

      {/* Module icons */}
      {MODULES.filter(m => m.enabled).map(mod => {
        const Icon = ICON_MAP[mod.icon] || TrendingUp;
        const isActive = location.pathname.startsWith(mod.basePath);
        return (
          <button
            key={mod.id}
            onClick={() => navigate(mod.basePath)}
            title={mod.name}
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center transition-all
              ${isActive
                ? 'text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }
            `}
            style={isActive ? { backgroundColor: mod.color } : {}}
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
