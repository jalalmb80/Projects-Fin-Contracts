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

// ── Contract status config ────────────────────────────────────────────────────
export interface ContractStatusConfig {
  id: string;
  label: string;
  is_win: boolean;
  is_lose: boolean;
  color?: string;
}

export interface AppSettings {
  entities: PartyOneEntity[];
  default_vat_rate: number;
  contract_statuses: ContractStatusConfig[];
  contract_types: string[];
  workflow_roles: string[];
}

export type ContractStatus = string;
export type ContractType   = string;

export type AppendixType = 'قائمة الخدمات' | 'التهيئة التقنية' | 'العرض الفني' | 'قائمة الأسعار' | 'أخرى';
export type ArticleType  = 'تمهيد' | 'موضوع' | 'مدة التنفيذ' | 'القيمة والدفعات' | 'الملكية الفكرية' | 'إدارة المشروع' | 'طلبات التغيير' | 'إنهاء الاتفاقية' | 'أحكام عامة' | 'نسخ الاتفاقية' | 'مخصص';

export type ArticleBlockType = 'paragraph' | 'list' | 'page_break';

export interface ParagraphBlock {
  id: string;
  type: 'paragraph';
  text_ar: string;
}

export interface ListBlockItem {
  id: string;
  text_ar: string;
}

export interface ListBlock {
  id: string;
  type: 'list';
  style: 'ordered' | 'unordered' | 'alpha';
  items: ListBlockItem[];
}

export interface PageBreakBlock {
  id: string;
  type: 'page_break';
  label?: string;
}

export type ArticleBlock = ParagraphBlock | ListBlock | PageBreakBlock;

export interface Client {
  id: string;
  name_ar: string;
  entity_type: 'شركة' | 'جمعية' | 'جهة حكومية' | 'فرد';
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
  frequency: 'مرة واحدة' | 'سنوي' | 'شهري';
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
  attachment_type: 'العرض الفني' | 'التصاميم' | 'وثيقة النطاق' | 'أخرى';
  uploaded_at: string;
}

export interface ContractVersion {
  version_number: number;
  created_at: string;
  change_summary: string;
  snapshot: Omit<Contract, 'versions'>;
}

// ── Workflow ──────────────────────────────────────────────────────────────────

/**
 * The person/team responsible for the next action after this event.
 * role  = selected from the configurable workflow_roles list (or free-typed if 'أخرى')
 * name  = always free text — the actual individual's name
 */
export interface WorkflowAssignee {
  role: string;
  name: string;
}

/**
 * A single entry in the contract's audit trail.
 *
 * type === 'transition'  → status changed from from_status to to_status
 * type === 'note'        → from_status === to_status (status unchanged, note added)
 */
export interface WorkflowEvent {
  id: string;
  type: 'transition' | 'note';
  from_status: string | null;   // null reserved for future first-event use
  to_status: string;
  assignee: WorkflowAssignee;
  note: string;                 // required for 'note' type; optional for 'transition'
  actor_name: string;           // Firebase user displayName ?? email prefix
  actor_email: string;
  created_at: string;           // ISO timestamp
}

export type ProjectType =
  | 'تطوير منصة'
  | 'تطوير تطبيق'
  | 'موقع إلكتروني'
  | 'اشتراك سنوي'
  | 'تهيئة وتشغيل'
  | 'استشارات'
  | 'أخرى';

export type ProjectStatus =
  | 'مخطط'
  | 'قيد التنفيذ'
  | 'مكتمل'
  | 'معلّق';

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
  /** Workflow audit trail. Absent on pre-workflow contracts — always read as ?? [] */
  workflow_events?: WorkflowEvent[];
}

export type ContractTemplateCategory =
  | 'تطوير برمجيات'
  | 'اشتراك/SaaS'
  | 'إنتاج محتوى'
  | 'مختلط'
  | 'مخصص';

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
  { id: 'draft',     label: 'مسودة',        is_win: false, is_lose: false, color: 'gray'    },
  { id: 'review',    label: 'قيد المراجعة', is_win: false, is_lose: false, color: 'yellow'  },
  { id: 'approved',  label: 'معتمد',        is_win: false, is_lose: false, color: 'blue'    },
  { id: 'signed',    label: 'موقّع',        is_win: true,  is_lose: false, color: 'emerald' },
  { id: 'active',    label: 'نشط',          is_win: true,  is_lose: false, color: 'green'   },
  { id: 'completed', label: 'مكتمل',        is_win: true,  is_lose: false, color: 'teal'    },
  { id: 'expired',   label: 'منتهي',        is_win: false, is_lose: false, color: 'orange'  },
  { id: 'cancelled', label: 'ملغى',         is_win: false, is_lose: true,  color: 'red'     },
  { id: 'lost',      label: 'خسارة',        is_win: false, is_lose: true,  color: 'red'     },
];

export const DEFAULT_CONTRACT_TYPES: string[] = [
  'تطوير برمجيات',
  'اشتراك/SaaS',
  'إنتاج محتوى',
  'مختلط',
];

export const DEFAULT_WORKFLOW_ROLES: string[] = [
  'مدير العقود',
  'فريق القانوني',
  'مدير المبيعات',
  'فريق التنفيذ',
  'الإدارة العليا',
  'أخرى',
];
