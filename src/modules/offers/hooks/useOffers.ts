import { useState, useEffect } from 'react';
import { subscribeOffers } from '../services/offerService';
import { subscribeTemplates } from '../services/templateService';
import * as offerService from '../services/offerService';
import * as templateService from '../services/templateService';
import { usePlatform } from '../../../core/context/PlatformContext';
import { Offer, OfferTemplate } from '../types';

export function useOffers() {
  const { user } = usePlatform();
  const [offers,    setOffers]    = useState<Offer[]>([]);
  const [templates, setTemplates] = useState<OfferTemplate[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const unsubs = [
      subscribeOffers(
        data => { setOffers(data); setLoading(false); },
        err  => { console.error('[useOffers] offers:', err.code); setLoading(false); },
      ),
      subscribeTemplates(
        data => setTemplates(data),
        err  => { console.error('[useOffers] templates:', err.code); },
      ),
    ];
    return () => unsubs.forEach(u => u());
  }, [user]);

  return {
    offers,
    templates,
    loading,
    createOffer:         offerService.createOffer,
    updateOffer:         offerService.updateOffer,
    addWorkflowLogEntry: offerService.addWorkflowLogEntry,
    addNote:             offerService.addNote,
    updateSections:      offerService.updateSections,
    updateLineItems:     offerService.updateLineItems,
    createTemplate:      templateService.createTemplate,
    updateTemplate:      templateService.updateTemplate,
    archiveTemplate:     templateService.archiveTemplate,
  };
}
