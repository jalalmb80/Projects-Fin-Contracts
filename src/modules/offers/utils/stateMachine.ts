import { ALLOWED_TRANSITIONS, OfferStatus } from '../types';

export function canTransition(from: OfferStatus, to: OfferStatus): boolean {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}

export function getAvailableTransitions(from: OfferStatus): OfferStatus[] {
  return ALLOWED_TRANSITIONS[from] ?? [];
}

/** Transitions that require a written reason */
export const REASON_REQUIRED: OfferStatus[] = ['revised', 'lost'];
