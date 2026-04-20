import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import OffersLayout from './components/OffersLayout';

const OffersDashboardPage = lazy(() => import('./pages/OffersDashboardPage'));
const OffersListPage      = lazy(() => import('./pages/OffersListPage'));
const OfferBuilderPage    = lazy(() => import('./pages/OfferBuilderPage'));
const TemplatesPage       = lazy(() => import('./pages/TemplatesPage'));

const Fallback = <div className="flex h-full items-center justify-center"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>;

export default function OffersRoutes() {
  return (
    <Routes>
      <Route element={<OffersLayout />}>
        <Route index                  element={<Suspense fallback={Fallback}><OffersDashboardPage /></Suspense>} />
        <Route path="list"            element={<Suspense fallback={Fallback}><OffersListPage /></Suspense>} />
        <Route path="builder/:id"     element={<Suspense fallback={Fallback}><OfferBuilderPage /></Suspense>} />
        <Route path="templates"       element={<Suspense fallback={Fallback}><TemplatesPage /></Suspense>} />
      </Route>
    </Routes>
  );
}
