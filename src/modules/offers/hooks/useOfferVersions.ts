/**
 * useOfferVersions — subscribes to the offers/{offerId}/versions subcollection.
 *
 * Called only inside OfferBuilderPage (lazy: only when History tab is active).
 * Versions are written automatically on each status transition via the
 * addWorkflowLogEntry writeBatch (Phase 3).
 */
import { useState, useEffect } from 'react';
import { subscribeVersions } from '../services/offerService';
import { OfferVersion } from '../types';
import { usePlatform } from '../../../core/context/PlatformContext';

export function useOfferVersions(offerId: string | undefined) {
  const { user } = usePlatform();
  const [versions,        setVersions]        = useState<OfferVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(true);

  useEffect(() => {
    if (!user || !offerId) { setLoadingVersions(false); return; }
    setLoadingVersions(true);
    return subscribeVersions(
      offerId,
      data => { setVersions(data); setLoadingVersions(false); },
      err  => { console.error('[useOfferVersions]', err.code); setLoadingVersions(false); },
    );
  }, [user, offerId]);

  return { versions, loadingVersions };
}
