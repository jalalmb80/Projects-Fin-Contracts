/**
 * OffersContext — platform-level provider for the Offers module.
 *
 * OffersProvider wraps OffersLayout so that useOffers() runs exactly ONCE,
 * opening a single set of Firestore listeners regardless of how many pages
 * are mounted simultaneously.
 *
 * Pages use useOffersContext() instead of calling useOffers() directly.
 * OfferBuilderPage uses the separate useOfferDetail(id) hook for
 * per-offer subcollection data (workflow_log, notes).
 */
import React, { createContext, useContext } from 'react';
import { useOffers } from '../hooks/useOffers';

type OffersContextValue = ReturnType<typeof useOffers>;

const OffersCtx = createContext<OffersContextValue | null>(null);

export function OffersProvider({ children }: { children: React.ReactNode }) {
  const value = useOffers();
  return <OffersCtx.Provider value={value}>{children}</OffersCtx.Provider>;
}

export function useOffersContext(): OffersContextValue {
  const ctx = useContext(OffersCtx);
  if (!ctx) throw new Error('useOffersContext must be used inside OffersProvider');
  return ctx;
}
