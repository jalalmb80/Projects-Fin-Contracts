/**
 * useOfferDetail — subscribes to the per-offer subcollections.
 *
 * Call this only inside OfferBuilderPage (or any component that displays
 * the full workflow timeline and notes for a single offer).
 * Do NOT call from list or dashboard pages — they only need the top-level
 * offers collection, which is provided by OffersProvider.
 */
import { useState, useEffect } from 'react';
import {
  subscribeWorkflowLog,
  subscribeNotes,
} from '../services/offerService';
import { WorkflowLogEntry, OfferNote } from '../types';
import { usePlatform } from '../../../core/context/PlatformContext';

export function useOfferDetail(offerId: string | undefined) {
  const { user }     = usePlatform();
  const [workflowLog, setWorkflowLog] = useState<WorkflowLogEntry[]>([]);
  const [notes,       setNotes]       = useState<OfferNote[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(true);

  useEffect(() => {
    if (!user || !offerId) {
      setLoadingDetail(false);
      return;
    }

    setLoadingDetail(true);
    let wlReady    = false;
    let notesReady = false;

    const checkDone = () => {
      if (wlReady && notesReady) setLoadingDetail(false);
    };

    const unsubs = [
      subscribeWorkflowLog(
        offerId,
        data => { setWorkflowLog(data); wlReady = true; checkDone(); },
        err  => { console.error('[useOfferDetail] workflow_log:', err.code); wlReady = true; checkDone(); },
      ),
      subscribeNotes(
        offerId,
        data => { setNotes(data); notesReady = true; checkDone(); },
        err  => { console.error('[useOfferDetail] notes:', err.code); notesReady = true; checkDone(); },
      ),
    ];

    return () => unsubs.forEach(u => u());
  }, [user, offerId]);

  return { workflowLog, notes, loadingDetail };
}
