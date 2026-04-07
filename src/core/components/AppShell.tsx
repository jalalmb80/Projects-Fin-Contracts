import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { usePlatform } from '../context/PlatformContext';
import { MODULES } from '../registry';
import ModuleSwitcher from './ModuleSwitcher';
import LoginPage from '../../modules/finance/pages/LoginPage';

export default function AppShell() {
  const { user, loadingAuth } = usePlatform();

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-white text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <ModuleSwitcher />
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full text-slate-500">
            Loading module...
          </div>
        }>
          <Routes>
            <Route path="/" element={<Navigate to="/finance/dashboard" replace />} />
            {MODULES.map(mod => {
              const Component = mod.component;
              return (
                <React.Fragment key={mod.id}>
                  <Route
                    path={`${mod.basePath}/*`}
                    element={<Component />}
                  />
                </React.Fragment>
              );
            })}
            <Route path="*" element={<Navigate to="/finance/dashboard" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}
