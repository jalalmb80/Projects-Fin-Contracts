export interface PartyOneEntity {
  id: string;
  name_ar: string;
  cr_number: string;
  representative_name: string;
  representative_title: string;
  address: string;
  city: string;
  postal_code?: string;
  po_box?: string;
  phone: string;
  email: string;
  logo_base64?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  bank_iban: string;
  bank_name: string;
  account_holder: string;
  is_default: boolean;
}

// ── Contract status config ─────────────────────────────────────────────────────
interface ContractStatusConfig {
  id: string;
  label: string;
  is_win: boolean;
  is_lose: boolean;
  color?: string;
}

export type { ContractStatusConfig };

export interface AppSettings {
  entities: PartyOneEntity[];
  default_vat_rate: number;
  contract_statuses: ContractStatusConfig[];
  contract_types: string[];
  workflow_roles: string[];
}

export type ContractStatus = string;
export type ContractType   = string;

export type AppendixType = '\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062e\u062f\u0645\u0627\u062a' | '\u0627\u0644\u062a\u0647\u064a\u0626\u0629 \u0627\u0644\u062a\u0642\u0646\u064a\u0629' | '\u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u0641\u0646\u064a' | '\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0623\u0633\u0639\u0627\u0631' | '\u0623\u062e\u0631\u0649';
export type ArticleType  = '\u062a\u0645\u0647\u064a\u062f' | '\u0645\u0648\u0636\u0648\u0639' | '\u0645\u062f\u0629 \u0627\u0644\u062a\u0646\u0641\u064a\u0630' | '\u0627\u0644\u0642\u064a\u0645\u0629 \u0648\u0627\u0644\u062f\u0641\u0639\u0627\u062a' | '\u0627\u0644\u0645\u0644\u0643\u064a\u0629 \u0627\u0644\u0641\u0643\u0631\u064a\u0629' | '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0634\u0631\u0648\u0639' | '\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u062a\u063a\u064a\u064a\u0631' | '\u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0627\u062a\u0641\u0627\u0642\u064a\u0629' | '\u0623\u062d\u0643\u0627\u0645 \u0639\u0627\u0645\u0629' | '\u0646\u0633\u062e \u0627\u0644\u0627\u062a\u0641\u0627\u0642\u064a\u0629' | '\u0645\u062e\u0635\u0635';

export type ArticleBlockType = 'paragraph' | 'list' | 'page_break';

export interface ParagraphBlock { id: string; type: 'paragraph'; text_ar: string; }
export interface ListBlockItem  { id: string; text_ar: string; }
export interface ListBlock      { id: string; type: 'list'; style: 'ordered' | 'unordered' | 'alpha'; items: ListBlockItem[]; }
export interface PageBreakBlock { id: string; type: 'page_break'; label?: string; }
export type ArticleBlock = ParagraphBlock | ListBlock | PageBreakBlock;

export interface Client {
  id: string;
  name_ar: string;
  entity_type: '\u0634\u0631\u0643\u0629' | '\u062c\u0645\u0639\u064a\u0629' | '\u062c\u0647\u0629 \u062d\u0643\u0648\u0645\u064a\u0629' | '\u0641\u0631\u062f';
  license_authority: string;
  license_no: string;
  representative_name: string;
  representative_title: string;
  national_id: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
}

export interface Article {
  id: string;
  order_index: number;
  title_ar: string;
  body_ar: string;
  blocks?: ArticleBlock[];
  article_type: ArticleType;
  is_locked: boolean;
  is_visible: boolean;
}

export interface Installment {
  id: string;
  label_ar: string;
  trigger_event: string;
  percentage: number;
  amount_sar: number;
  amount_words_ar: string;
}

export interface TaskRow {
  id: string;
  task_name_ar: string;
  duration: string;
  cost_sar: number;
  frequency: '\u0645\u0631\u0629 \u0648\u0627\u062d\u062f\u0629' | '\u0633\u0646\u0648\u064a' | '\u0634\u0647\u0631\u064a';
}

export interface PaymentSchedule {
  subtotal_sar: number;
  vat_rate: number;
  vat_amount: number;
  total_sar: number;
  bank_iban: string;
  bank_name: string;
  account_holder: string;
  tasks: TaskRow[];
  installments: Installment[];
}

export interface Appendix {
  id: string;
  order_index: number;
  title_ar: string;
  body_ar: string;
  appendix_type: AppendixType;
}

export interface Attachment {
  id: string;
  title: string;
  file_type: string;
  attachment_type: '\u0627\u0644\u0639\u0631\u0636 \u0627\u0644\u0641\u0646\u064a' | '\u0627\u0644\u062a\u0635\u0627\u0645\u064a\u0645' | '\u0648\u062b\u064a\u0642\u0629 \u0627\u0644\u0646\u0637\u0627\u0642' | '\u0623\u062e\u0631\u0649';
  uploaded_at: string;
}

export interface ContractVersion {
  version_number: number;
  created_at: string;
  change_summary: string;
  snapshot: Omit<Contract, 'versions'>;
}

// ── Workflow ───────────────────────────────────────────────────────────────────

export interface WorkflowAssignee {
  role: string;
  name: string;
}

export interface WorkflowEvent {
  id: string;
  type: 'transition' | 'note';
  from_status: string | null;
  to_status: string;
  assignee: WorkflowAssignee;
  note: string;
  actor_name: string;
  actor_email: string;
  created_at: string;
}

export type ProjectType =
  | '\u062a\u0637\u0648\u064a\u0631 \u0645\u0646\u0635\u0629'
  | '\u062a\u0637\u0648\u064a\u0631 \u062a\u0637\u0628\u064a\u0642'
  | '\u0645\u0648\u0642\u0639 \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a'
  | '\u0627\u0634\u062a\u0631\u0627\u0643 \u0633\u0646\u0648\u064a'
  | '\u062a\u0647\u064a\u0626\u0629 \u0648\u062a\u0634\u063a\u064a\u0644'
  | '\u0627\u0633\u062a\u0634\u0627\u0631\u0627\u062a'
  | '\u0623\u062e\u0631\u0649';

export type ProjectStatus =
  | '\u0645\u062e\u0637\u0637'
  | '\u0642\u064a\u062f \u0627\u0644\u062a\u0646\u0641\u064a\u0630'
  | '\u0645\u0643\u062a\u0645\u0644'
  | '\u0645\u0639\u0644\u0651\u0642';

export interface Project {
  id: string;
  name_ar: string;
  project_type: ProjectType;
  client_id: string;
  amount_sar: number;
  status: ProjectStatus;
  description?: string;
  start_date?: string;
}

export interface Contract {
  id: string;
  entity_id?: string;
  project_id?: string;
  template_id?: string;
  contract_number: string;
  title_ar: string;
  type: ContractType;
  status: ContractStatus;
  client_id: string;
  start_date: string;
  end_date?: string;
  hijri_date?: string;
  articles: Article[];
  payment_schedule: PaymentSchedule;
  appendices: Appendix[];
  attachments: Attachment[];
  versions: ContractVersion[];
  tags: string[];
  workflow_events?: WorkflowEvent[];
  /**
   * ID of the Offer that was won to produce this contract.
   * Set by CreateContractFromOfferModal (Phase 3).
   * Absent on contracts created directly in the CMS.
   */
  linked_offer_id?: string;
}

export type ContractTemplateCategory =
  | '\u062a\u0637\u0648\u064a\u0631 \u0628\u0631\u0645\u062c\u064a\u0627\u062a'
  | '\u0627\u0634\u062a\u0631\u0627\u0643/SaaS'
  | '\u0625\u0646\u062a\u0627\u062c \u0645\u062d\u062a\u0648\u0649'
  | '\u0645\u062e\u062a\u0644\u0637'
  | '\u0645\u062e\u0635\u0635';

export interface ContractTemplate {
  id: string;
  name_ar: string;
  description?: string;
  category: ContractTemplateCategory;
  entity_id?: string;
  default_status: ContractStatus;
  default_type: ContractType;
  default_articles: Article[];
  default_appendices: Appendix[];
  default_payment_schedule: PaymentSchedule;
  tags?: string[];
  is_default?: boolean;
}

// ── Default lists ─────────────────────────────────────────────────────────────
export const DEFAULT_CONTRACT_STATUSES: ContractStatusConfig[] = [
  { id: 'draft',     label: '\u0645\u0633\u0648\u062f\u0629',        is_win: false, is_lose: false, color: 'gray'    },
  { id: 'review',    label: '\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629', is_win: false, is_lose: false, color: 'yellow'  },
  { id: 'approved',  label: '\u0645\u0639\u062a\u0645\u062f',        is_win: false, is_lose: false, color: 'blue'    },
  { id: 'signed',    label: '\u0645\u0648\u0642\u0651\u0639',        is_win: true,  is_lose: false, color: 'emerald' },
  { id: 'active',    label: '\u0646\u0634\u0637',          is_win: true,  is_lose: false, color: 'green'   },
  { id: 'completed', label: '\u0645\u0643\u062a\u0645\u0644',        is_win: true,  is_lose: false, color: 'teal'    },
  { id: 'expired',   label: '\u0645\u0646\u062a\u0647\u064a',        is_win: false, is_lose: false, color: 'orange'  },
  { id: 'cancelled', label: '\u0645\u0644\u063a\u0649',         is_win: false, is_lose: true,  color: 'red'     },
  { id: 'lost',      label: '\u062e\u0633\u0627\u0631\u0629',        is_win: false, is_lose: true,  color: 'red'     },
];

export const DEFAULT_CONTRACT_TYPES: string[] = [
  '\u062a\u0637\u0648\u064a\u0631 \u0628\u0631\u0645\u062c\u064a\u0627\u062a',
  '\u0627\u0634\u062a\u0631\u0627\u0643/SaaS',
  '\u0625\u0646\u062a\u0627\u062c \u0645\u062d\u062a\u0648\u0649',
  '\u0645\u062e\u062a\u0644\u0637',
];

export const DEFAULT_WORKFLOW_ROLES: string[] = [
  '\u0645\u062f\u064a\u0631 \u0627\u0644\u0639\u0642\u0648\u062f',
  '\u0641\u0631\u064a\u0642 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a',
  '\u0645\u062f\u064a\u0631 \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a',
  '\u0641\u0631\u064a\u0642 \u0627\u0644\u062a\u0646\u0641\u064a\u0630',
  '\u0627\u0644\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0639\u0644\u064a\u0627',
  '\u0623\u062e\u0631\u0649',
];
