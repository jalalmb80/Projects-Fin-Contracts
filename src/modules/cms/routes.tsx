import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import CMSLayout from './components/CMSLayout';

const CMSDashboardPage = lazy(() => import('./pages/CMSDashboardPage'));
const ContractsPage    = lazy(() => import('./pages/ContractsPage'));
const CMSClientsPage   = lazy(() => import('./pages/CMSClientsPage'));
const CMSProjectsPage  = lazy(() => import('./pages/CMSProjectsPage'));
const TemplatesPage    = lazy(() => import('./pages/TemplatesPage'));
const CMSSettingsPage  = lazy(() => import('./pages/CMSSettingsPage'));

export default function CMSRoutes() {
  return (
    <Routes>
      <Route element={<CMSLayout />}>
        <Route index element={<Suspense fallback={<div>Loading...</div>}><CMSDashboardPage /></Suspense>} />
        <Route path="contracts" element={<Suspense fallback={<div>Loading...</div>}><ContractsPage /></Suspense>} />
        <Route path="clients" element={<Suspense fallback={<div>Loading...</div>}><CMSClientsPage /></Suspense>} />
        <Route path="projects" element={<Suspense fallback={<div>Loading...</div>}><CMSProjectsPage /></Suspense>} />
        <Route path="templates" element={<Suspense fallback={<div>Loading...</div>}><TemplatesPage /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<div>Loading...</div>}><CMSSettingsPage /></Suspense>} />
      </Route>
    </Routes>
  );
}
