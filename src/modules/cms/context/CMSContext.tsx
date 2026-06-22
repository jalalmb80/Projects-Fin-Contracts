/**
 * CMSContext — platform-level provider for the CMS module.
 *
 * CMSProvider wraps CMSLayoutInner so that useContracts() runs exactly
 * ONCE, opening a single set of Firestore listeners regardless of how
 * many CMS pages are mounted simultaneously.
 *
 * Without this provider, each CMS page independently called useContracts(),
 * opening 3 duplicate onSnapshot connections (cms_contracts, cms_templates,
 * cms_projects) plus a shared_clients listener inside useSharedClients.
 * With 5 pages mounted that was up to 15 redundant listeners.
 *
 * Pages call useCMSContext() instead of useContracts().
 * This mirrors the OffersProvider/useOffersContext pattern.
 *
 * Provider mount order in CMSLayout:
 *   LanguageProvider
 *     SettingsProvider
 *       CMSProvider       ← data layer (Firestore listeners)
 *         CMSLayoutInner  ← layout + Outlet + CMSOfferWonHandler
 */
import React, { createContext, useContext } from 'react';
import { useContracts } from '../hooks/useContracts';

type CMSContextValue = ReturnType<typeof useContracts>;

const CMSCtx = createContext<CMSContextValue | null>(null);

export function CMSProvider({ children }: { children: React.ReactNode }) {
  const value = useContracts();
  return <CMSCtx.Provider value={value}>{children}</CMSCtx.Provider>;
}

export function useCMSContext(): CMSContextValue {
  const ctx = useContext(CMSCtx);
  if (!ctx) throw new Error('useCMSContext must be used inside CMSProvider (CMSLayout)');
  return ctx;
}
