import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import CMSLayout from './components/CMSLayout';

const CMSDashboardPage = lazy(() => import('./pages/CMSDashboardPage'));
const ContractsPage    = lazy(() => import('./pages/ContractsPage'));
const CMSClientsPage   = lazy(() => import('./pages/CMSClientsPage'));
const CMSProjectsPage  = lazy(() => import('./pages/CMSProjectsPage'));
const TemplatesPage    = lazy(() => import('./pages/TemplatesPage'));
const CMSSettingsPage  = lazy(() => import('./pages/CMSSettingsPage'));
const CMSSeedPage      = lazy(() => import('./pages/CMSSeedPage'));

const Fallback = <div className="p-8 text-slate-400">جارٍ التحميل...</div>;

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
        <Route path="admin/seed"    element={<Suspense fallback={Fallback}><CMSSeedPage /></Suspense>} />
      </Route>
    </Routes>
  );
}
