/**
 * CMSLayout — shell for the CMS module.
 *
 * Phase 3 addition: CMSOfferWonHandler subscribes to the platformBus
 * OFFER_WON event and opens CreateContractFromOfferModal when triggered.
 * The handler only fires when CMS is mounted; if the user is on another
 * module when the offer is won, the modal will not appear. This matches
 * the existing CONTRACT_SIGNED → CreateFinanceProjectModal pattern.
 */
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { LanguageProvider, useLang } from '../context/LanguageContext';
import { SettingsProvider, useSettings } from '../context/SettingsContext';
import { platformBus, PLATFORM_EVENTS } from '../../../core/events/platformBus';
import Sidebar from './Sidebar';
import CreateContractFromOfferModal from './CreateContractFromOfferModal';

interface OfferWonPayload {
  offerId:     string;
  offerNumber: string;
  clientId:    string;
  clientName:  string;
  totalValue:  number;
}

function CMSOfferWonHandler() {
  const [wonPayload, setWonPayload] = useState<OfferWonPayload | null>(null);

  useEffect(() => {
    // platformBus.on returns an unsubscribe function
    return platformBus.on(PLATFORM_EVENTS.OFFER_WON, (payload: OfferWonPayload) => {
      setWonPayload(payload);
    });
  }, []);

  if (!wonPayload) return null;

  return (
    <CreateContractFromOfferModal
      payload={wonPayload}
      onClose={() => setWonPayload(null)}
    />
  );
}

function CMSLayoutInner() {
  const { settingsLoading } = useSettings();
  const { lang }            = useLang();
  const isRTL               = lang === 'ar';

  if (settingsLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50" dir="rtl">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0645\u064a\u0644...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* OFFER_WON bus subscriber — renders modal when fired */}
      <CMSOfferWonHandler />
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <Outlet />
      </div>
    </div>
  );
}

export default function CMSLayout() {
  return (
    <LanguageProvider>
      <SettingsProvider>
        <CMSLayoutInner />
      </SettingsProvider>
    </LanguageProvider>
  );
}
