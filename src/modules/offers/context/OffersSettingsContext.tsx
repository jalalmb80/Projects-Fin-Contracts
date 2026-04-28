/**
 * OffersSettingsContext — configurable offer-module settings.
 *
 * Loads once from Firestore (getDoc, not a live listener — settings rarely
 * change during a session). Persists back to offer_settings/general on write.
 *
 * Currently exposes:
 *   - offerWorkflowRoles: string[]  (used by OfferTransitionModal / OfferNoteModal)
 *
 * Phase 2+ will add: offer_statuses config, default VAT rate, entity selection.
 *
 * OffersSettingsProvider wraps OffersLayoutInner inside OffersLayout.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../core/firebase';
import { usePlatform } from '../../../core/context/PlatformContext';
import { DEFAULT_OFFER_WORKFLOW_ROLES } from '../types';

interface OffersSettingsContextType {
  offerWorkflowRoles:       string[];
  updateOfferWorkflowRoles: (roles: string[]) => Promise<void>;
  offerSettingsLoading:     boolean;
}

const OffersSettingsCtx = createContext<OffersSettingsContextType>({
  offerWorkflowRoles:       DEFAULT_OFFER_WORKFLOW_ROLES,
  updateOfferWorkflowRoles: async () => {},
  offerSettingsLoading:     false,
});

export function OffersSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = usePlatform();

  const [workflowRoles, setWorkflowRoles] = useState<string[]>(DEFAULT_OFFER_WORKFLOW_ROLES);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    getDoc(doc(db, 'offer_settings', 'general'))
      .then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.workflow_roles) && data.workflow_roles.length > 0) {
            setWorkflowRoles(data.workflow_roles);
          }
        }
      })
      .catch(err => console.error('[OffersSettingsContext] load error:', err.code))
      .finally(() => setLoading(false));
  }, [user]);

  const updateOfferWorkflowRoles = async (roles: string[]): Promise<void> => {
    setWorkflowRoles(roles);
    await setDoc(
      doc(db, 'offer_settings', 'general'),
      { workflow_roles: roles },
      { merge: true },
    );
  };

  return (
    <OffersSettingsCtx.Provider
      value={{
        offerWorkflowRoles:       workflowRoles,
        updateOfferWorkflowRoles,
        offerSettingsLoading:     loading,
      }}
    >
      {children}
    </OffersSettingsCtx.Provider>
  );
}

export function useOffersSettings(): OffersSettingsContextType {
  return useContext(OffersSettingsCtx);
}
