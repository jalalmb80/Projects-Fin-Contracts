import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import CMSLayout from './components/CMSLayout';
import GlobalSettingsPage from '../../core/pages/GlobalSettingsPage';

const CMSDashboardPage = lazy(() => import('./pages/CMSDashboardPage'));
const ContractsPage    = lazy(() => import('./pages/ContractsPage'));
const CMSClientsPage   = lazy(() => import('./pages/CMSClientsPage'));
const CMSProjectsPage  = lazy(() => import('./pages/CMSProjectsPage'));
const TemplatesPage    = lazy(() => import('./pages/TemplatesPage'));
const CMSSettingsPage  = lazy(() => import('./pages/CMSSettingsPage'));
const CMSSeedPage      = lazy(() => import('./pages/CMSSeedPage'));

const Fallback = <div className="p-8 text-slate-400">\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0645\u064a\u0644...</div>;

export default function CMSRoutes() {
  return (
    <Routes>
      <Route element={<CMSLayout />}>
        <Route index                element={<Suspense fallback={Fallback}><CMSDashboardPage /></Suspense>} />
        <Route path="contracts"     element={<Suspense fallback={Fallback}><ContractsPage /></Suspense>} />
        <Route path="clients"       element={<Suspense fallback={Fallback}><CMSClientsPage /></Suspense>} />
        <Route path="projects"      element={<Suspense fallback={Fallback}><CMSProjectsPage /></Suspense>} />
        <Route path="templates"     element={<Suspense fallback={Fallback}><TemplatesPage /></Suspense>} />
        <Route path="settings"      element={<Suspense fallback={Fallback}><CMSSettingsPage /></Suspense>} />
        <Route path="global-settings" element={<Suspense fallback={Fallback}><GlobalSettingsPage /></Suspense>} />
        <Route path="admin/seed"    element={<Suspense fallback={Fallback}><CMSSeedPage /></Suspense>} />
      </Route>
    </Routes>
  );
}
