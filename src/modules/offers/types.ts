// ── Offers Module — Type Definitions ─────────────────────────────────────────

export type OfferStatus =
  | 'draft'
  | 'under_review'
  | 'revised'
  | 'pending_approval'
  | 'approved'
  | 'sent_to_client'
  | 'won'
  | 'lost'
  | 'expired'
  | 'archived';

export type OfferLanguage = 'en' | 'ar';
export type OfferCurrency = 'SAR' | 'USD' | 'EUR' | 'AED';

export type SectionType =
  | 'cover_page'
  | 'executive_summary'
  | 'company_profile'
  | 'scope_of_work'
  | 'technical_approach'
  | 'team_profiles'
  | 'project_timeline'
  | 'pricing_table'
  | 'payment_schedule'
  | 'case_studies'
  | 'deliverables'
  | 'faq'
  | 'terms_and_conditions'
  | 'signature_block'
  | 'legal_disclaimer'
  | 'custom_rich_text';

export type NoteType =
  | 'general'
  | 'review_feedback'
  | 'approval_decision'
  | 'pricing_query'
  | 'legal'
  | 'client_communication'
  | 'reminder';

export type NoteVisibility = 'internal' | 'external';

// ── Workflow Assignee ─────────────────────────────────────────────────────────
// Mirrors CMS WorkflowAssignee — parity with contracts module.

export interface WorkflowAssignee {
  /** Role selected from offerWorkflowRoles (offer_settings/general) or free text. */
  role: string;
  /** Full name of the person responsible for the next step. Required. */
  name: string;
}

// ── Line Items ────────────────────────────────────────────────────────────────

export interface LineItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_pct: number;
  line_total: number;
  is_mandatory: boolean;
  is_included: boolean;
}

// ── Sections ──────────────────────────────────────────────────────────────────

export interface OfferSection {
  id: string;
  type: SectionType;
  title_en: string;
  title_ar: string;
  position: number;
  is_fixed: boolean;
  content: string;
  is_visible: boolean;
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export interface OfferNote {
  id: string;
  author_name: string;
  author_email: string;
  note_type: NoteType;
  visibility: NoteVisibility;
  body: string;
  parent_note_id: string | null;
  is_system_generated: boolean;
  is_pinned: boolean;
  created_at: string;
}

// ── Workflow Log ──────────────────────────────────────────────────────────────
// Shape mirrors CMS WorkflowEvent — parity achieved in Phase 1.

export interface WorkflowLogEntry {
  id: string;
  /**
   * 'transition' — status changed.
   * 'note'       — status unchanged; manual audit comment.
   */
  type: 'transition' | 'note';
  actor_name: string;
  actor_email: string;
  /**
   * The person responsible for the next step.
   * Collected via OfferTransitionModal / OfferNoteModal.
   */
  assignee: WorkflowAssignee;
  from_status: OfferStatus | null;
  to_status: OfferStatus;
  /**
   * Free-text reason (transitions) or note body (type==='note').
   * Required when type === 'note' or when status is in REASON_REQUIRED.
   */
  reason: string;
  /** True when written by the system (e.g. on offer creation). */
  is_system_generated?: boolean;
  created_at: string;
}

// ── Core Entities ─────────────────────────────────────────────────────────────

export interface Offer {
  id: string;
  offer_number: string;
  title_en: string;
  title_ar: string;
  status: OfferStatus;
  language: OfferLanguage;
  client_id: string;
  client_name: string;
  assigned_to: string[];
  template_id: string;
  template_version: number;
  expiry_date: string;
  currency: OfferCurrency;
  vat_rate: number;
  global_discount_pct: number;
  subtotal: number;
  discount_amount: number;
  vat_amount: number;
  total_value: number;
  sections: OfferSection[];
  line_items: LineItem[];
  tags: string[];
  linked_contract_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  /**
   * @deprecated Embedded array — migrated to offers/{id}/notes subcollection (Phase 0).
   * Present only on documents created before 2026-04-28.
   */
  notes?: OfferNote[];
  /**
   * @deprecated Embedded array — migrated to offers/{id}/workflow_log subcollection (Phase 0).
   * Present only on documents created before 2026-04-28.
   */
  workflow_log?: WorkflowLogEntry[];
}

export interface OfferTemplateSection {
  id: string;
  type: SectionType;
  title_en: string;
  title_ar: string;
  position: number;
  is_fixed: boolean;
  default_content: string;
}

export interface OfferTemplate {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  language: OfferLanguage;
  status: 'active' | 'archived';
  version: number;
  sections: OfferTemplateSection[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ── State Machine ─────────────────────────────────────────────────────────────

export const ALLOWED_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
  draft:            ['under_review'],
  under_review:     ['revised', 'pending_approval', 'lost'],
  revised:          ['under_review', 'draft'],
  pending_approval: ['approved', 'under_review'],
  approved:         ['sent_to_client', 'draft'],
  sent_to_client:   ['won', 'lost'],
  won:              ['archived'],
  lost:             ['archived'],
  expired:          ['archived'],
  archived:         [],
};

export const STATUS_LABELS: Record<OfferStatus, { en: string; ar: string; color: string }> = {
  draft:            { en: 'Draft',            ar: '\u0645\u0633\u0648\u062f\u0629',              color: 'slate'   },
  under_review:     { en: 'Under Review',     ar: '\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629',   color: 'yellow'  },
  revised:          { en: 'Revised',          ar: '\u0645\u0639\u062f\u064e\u0651\u0644',            color: 'orange'  },
  pending_approval: { en: 'Pending Approval', ar: '\u0641\u064a \u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629', color: 'purple'  },
  approved:         { en: 'Approved',         ar: '\u0645\u0639\u062a\u0645\u062f',             color: 'blue'    },
  sent_to_client:   { en: 'Sent to Client',   ar: '\u0623\u064f\u0631\u0633\u0644 \u0644\u0644\u0639\u0645\u064a\u0644',   color: 'indigo'  },
  won:              { en: 'Won',              ar: '\u0645\u0643\u0633\u0648\u0628',             color: 'emerald' },
  lost:             { en: 'Lost',             ar: '\u062e\u0633\u0627\u0631\u0629',             color: 'red'     },
  expired:          { en: 'Expired',          ar: '\u0645\u0646\u062a\u0647\u064a \u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0629', color: 'orange'  },
  archived:         { en: 'Archived',         ar: '\u0645\u0624\u0631\u0634\u0641',             color: 'gray'    },
};

export const STATUS_COLOR_MAP: Record<string, string> = {
  slate:   'bg-slate-100 text-slate-700',
  yellow:  'bg-yellow-100 text-yellow-700',
  orange:  'bg-orange-100 text-orange-700',
  purple:  'bg-purple-100 text-purple-700',
  blue:    'bg-blue-100 text-blue-700',
  indigo:  'bg-indigo-100 text-indigo-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  red:     'bg-red-100 text-red-700',
  gray:    'bg-gray-100 text-gray-600',
};

export const SECTION_TYPE_LABELS: Record<SectionType, { en: string; ar: string; fixed: boolean }> = {
  cover_page:           { en: 'Cover Page',         ar: '\u0635\u0641\u062d\u0629 \u0627\u0644\u063a\u0644\u0627\u0641',      fixed: true  },
  executive_summary:    { en: 'Executive Summary',  ar: '\u0627\u0644\u0645\u0644\u062e\u0635 \u0627\u0644\u062a\u0646\u0641\u064a\u0630\u064a',  fixed: true  },
  company_profile:      { en: 'Company Profile',    ar: '\u0646\u0628\u0630\u0629 \u0639\u0646 \u0627\u0644\u0634\u0631\u0643\u0629',    fixed: false },
  scope_of_work:        { en: 'Scope of Work',      ar: '\u0646\u0637\u0627\u0642 \u0627\u0644\u0639\u0645\u0644',           fixed: false },
  technical_approach:   { en: 'Technical Approach', ar: '\u0627\u0644\u0645\u0646\u0647\u062c\u064a\u0629 \u0627\u0644\u062a\u0642\u0646\u064a\u0629',   fixed: false },
  team_profiles:        { en: 'Team Profiles',      ar: '\u0641\u0631\u064a\u0642 \u0627\u0644\u0639\u0645\u0644',           fixed: false },
  project_timeline:     { en: 'Project Timeline',   ar: '\u0627\u0644\u062c\u062f\u0648\u0644 \u0627\u0644\u0632\u0645\u0646\u064a',        fixed: false },
  pricing_table:        { en: 'Pricing Table',      ar: '\u062c\u062f\u0648\u0644 \u0627\u0644\u0623\u0633\u0639\u0627\u0631',         fixed: false },
  payment_schedule:     { en: 'Payment Schedule',   ar: '\u062c\u062f\u0648\u0644 \u0627\u0644\u062f\u0641\u0639',           fixed: false },
  case_studies:         { en: 'Case Studies',       ar: '\u062f\u0631\u0627\u0633\u0627\u062a \u0627\u0644\u062d\u0627\u0644\u0629',        fixed: false },
  deliverables:         { en: 'Deliverables',       ar: '\u0627\u0644\u0645\u062e\u0631\u062c\u0627\u062a',              fixed: false },
  faq:                  { en: 'FAQ',                ar: '\u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0634\u0627\u0626\u0639\u0629',        fixed: false },
  terms_and_conditions: { en: 'Terms & Conditions', ar: '\u0627\u0644\u0634\u0631\u0648\u0637 \u0648\u0627\u0644\u0623\u062d\u0643\u0627\u0645',       fixed: true  },
  signature_block:      { en: 'Signature Block',    ar: '\u062e\u0627\u0646\u0629 \u0627\u0644\u062a\u0648\u0642\u064a\u0639',        fixed: true  },
  legal_disclaimer:     { en: 'Legal Disclaimer',   ar: '\u0625\u062e\u0644\u0627\u0621 \u0627\u0644\u0645\u0633\u0624\u0648\u0644\u064a\u0629',    fixed: true  },
  custom_rich_text:     { en: 'Custom Section',     ar: '\u0642\u0633\u0645 \u0645\u062e\u0635\u0635',           fixed: false },
};

export const NOTE_TYPE_LABELS: Record<NoteType, { en: string; ar: string }> = {
  general:              { en: 'General',              ar: '\u0639\u0627\u0645' },
  review_feedback:      { en: 'Review Feedback',      ar: '\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629' },
  approval_decision:    { en: 'Approval Decision',    ar: '\u0642\u0631\u0627\u0631 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629' },
  pricing_query:        { en: 'Pricing Query',        ar: '\u0627\u0633\u062a\u0641\u0633\u0627\u0631 \u0633\u0639\u0631' },
  legal:                { en: 'Legal',                ar: '\u0642\u0627\u0646\u0648\u0646\u064a' },
  client_communication: { en: 'Client Communication', ar: '\u062a\u0648\u0627\u0635\u0644 \u0639\u0645\u064a\u0644' },
  reminder:             { en: 'Reminder',             ar: '\u062a\u0630\u0643\u064a\u0631' },
};

/** Default workflow roles — overridden by offer_settings/general.workflow_roles. */
export const DEFAULT_OFFER_WORKFLOW_ROLES: string[] = [
  'Offer Manager',
  'Technical Reviewer',
  'Finance Manager',
  'Account Manager',
  'Other',
];
