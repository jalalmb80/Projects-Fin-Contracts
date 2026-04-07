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
  logo_base64?: string;           // base64 encoded logo image
  primary_color: string;          // hex e.g. "#059669"
  secondary_color: string;        // hex e.g. "#f0fdf4"
  accent_color: string;           // hex e.g. "#064e3b"
  bank_iban: string;
  bank_name: string;
  account_holder: string;
  is_default: boolean;
}

export interface AppSettings {
  entities: PartyOneEntity[];
  default_vat_rate: number;
}

export type ContractStatus = 'مسودة' | 'قيد المراجعة' | 'معتمد' | 'موقّع' | 'نشط' | 'مكتمل' | 'منتهي';
export type ContractType = 'تطوير برمجيات' | 'اشتراك/SaaS' | 'إنتاج محتوى' | 'مختلط';
export type AppendixType = 'قائمة الخدمات' | 'التهيئة التقنية' | 'العرض الفني' | 'قائمة الأسعار' | 'أخرى';
export type ArticleType = 'تمهيد' | 'موضوع' | 'مدة التنفيذ' | 'القيمة والدفعات' | 'الملكية الفكرية' | 'إدارة المشروع' | 'طلبات التغيير' | 'إنهاء الاتفاقية' | 'أحكام عامة' | 'نسخ الاتفاقية' | 'مخصص';

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
  entity_id?: string;   // references PartyOneEntity.id
  project_id?: string;  // references Project.id
  template_id?: string; // references ContractTemplate.id
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
