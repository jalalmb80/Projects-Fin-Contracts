// =============================================================================
// src/core/hooks/useSharedClients.ts
//
// Backward-compatible thin wrapper around SharedClientsContext.
//
// All existing callers (AppContext, useContracts, SharedClientsPage, etc.) keep
// their current import path — zero refactor needed at call sites. The listener
// is now a singleton in SharedClientsProvider rather than per-call-site.
// =============================================================================

import { useSharedClientsContext } from '../context/SharedClientsContext';

export function useSharedClients() {
  return useSharedClientsContext();
}
