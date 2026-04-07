import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ProjectListPage from './pages/ProjectListPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import SubscriptionListPage from './pages/SubscriptionListPage';
import SubscriptionDetailPage from './pages/SubscriptionDetailPage';
import SubscriptionFormPage from './pages/SubscriptionFormPage';
import BillingListPage from './pages/BillingListPage';
import BillingDetailPage from './pages/BillingDetailPage';
import BillingFormPage from './pages/BillingFormPage';
import PaymentsPage from './pages/PaymentsPage';
import CounterpartiesPage from './pages/CounterpartiesPage';
import ProductsPage from './pages/ProductsPage';
import SettingsPage from './pages/SettingsPage';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';

export default function FinanceRoutes() {
  return (
    <LanguageProvider>
      <AppProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="projects">
              <Route index element={<ProjectListPage />} />
              <Route path=":id" element={<ProjectDetailPage />} />
            </Route>
            <Route path="subscriptions">
              <Route index element={<SubscriptionListPage />} />
              <Route path="new" element={<SubscriptionFormPage />} />
              <Route path=":id" element={<SubscriptionDetailPage />} />
            </Route>
            <Route path="billing">
              <Route index element={<BillingListPage />} />
              <Route path="new" element={<BillingFormPage />} />
              <Route path=":id" element={<BillingDetailPage />} />
            </Route>
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="counterparties" element={<CounterpartiesPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AppProvider>
    </LanguageProvider>
  );
}
