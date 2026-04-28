export type {
  Offer, OfferTemplate, OfferSection, LineItem,
  OfferNote, WorkflowLogEntry, WorkflowAssignee, OfferTemplateSection,
  OfferStatus, OfferLanguage, OfferCurrency,
  SectionType, NoteType, NoteVisibility,
} from './types';

export {
  ALLOWED_TRANSITIONS, STATUS_LABELS, STATUS_COLOR_MAP,
  SECTION_TYPE_LABELS, NOTE_TYPE_LABELS,
  DEFAULT_OFFER_WORKFLOW_ROLES,
} from './types';

export { useOffers }                             from './hooks/useOffers';
export { useOfferDetail }                        from './hooks/useOfferDetail';
export { useOffersContext, OffersProvider }       from './context/OffersContext';
export { useOffersSettings, OffersSettingsProvider } from './context/OffersSettingsContext';
export { calculateTotals, calculateLineTotal, formatCurrency } from './utils/pricing';
export { generateOfferNumber }                   from './utils/offerNumber';
export { canTransition, getAvailableTransitions, REASON_REQUIRED } from './utils/stateMachine';
