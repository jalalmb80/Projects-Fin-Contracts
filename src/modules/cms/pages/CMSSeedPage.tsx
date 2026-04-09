import React, { useState } from 'react';
import {
  collection, doc, setDoc, getDocs, query, limit,
} from 'firebase/firestore';
import { db } from '../../../core/firebase';
import { ContractTemplate, Client, Project, Contract, AppSettings, Article } from '../types';
import { CheckCircle, AlertCircle, Loader, Database, ChevronRight } from 'lucide-react';

const DEFAULT_ARTICLES: Article[] = [
  { id: 'a1', order_index: 1, title_ar: 'التمهيد', body_ar: 'يعتبر التمهيد السابق والمقدمة إضافةً إلى الملاحق المرفقة جزءاً لا يتجزأ من هذا العقد ومتممةً ومفسرةً لأحكامه.', article_type: 'تمهيد', is_locked: true, is_visible: true },
  { id: 'a2', order_index: 2, title_ar: 'الموضوع', body_ar: '[عنوان العقد] لصالح الطرف الثاني ([اسم الطرف الثاني]) اعتماداً على العرض الفني المعتمد من قبل الطرفين والملحق مع هذا العقد.', article_type: 'موضوع', is_locked: false, is_visible: true },
  { id: 'a3', order_index: 3, title_ar: 'مدة التنفيذ', body_ar: 'يلتزم الطرف الأول بتنفيذ [عنوان العقد] لصالح الطرف الثاني خلال مدة لا تزيد عن ستة أشهر من تاريخ توقيع العقد من كلا الطرفين وتحويل الدفعة الأولى لحساب الطرف الأول.', article_type: 'مدة التنفيذ', is_locked: false, is_visible: true },
  { id: 'a4', order_index: 4, title_ar: 'القيمة والدفعات', body_ar: 'تبلغ قيمة العقد الإجمالية المبلغ المحدد في جدول الدفعات أدناه شاملةً ضريبة القيمة المضافة.\n\nيلتزم الطرف الثاني بإيداع جميع المستحقات المالية للطرف الأول في حسابه في بنك البلاد باسم شركة دراية الذكية لتقنية المعلومات.\n\nفي حال تأخر الطرف الثاني عن الرد خلال يومي عمل على مخاطبات الطرف الأول فلا تُحتسب المدة التي تزيد عن يومي العمل جزءاً من مدة التنفيذ.', article_type: 'القيمة والدفعات', is_locked: false, is_visible: true },
  { id: 'a5', order_index: 5, title_ar: 'الملكية الفكرية', body_ar: 'الملكية الفكرية للمشروع بمكوناته المختلفة هي ملك للطرف الثاني ولا يحق للطرف الأول طلب أي حقوق ملكية عن مخرجات المشروع بعد استلام كامل المستحقات المالية.', article_type: 'الملكية الفكرية', is_locked: false, is_visible: true },
  { id: 'a6', order_index: 6, title_ar: 'آلية إدارة المشروع والدعم الفني', body_ar: '١. بعد الاتفاق وتوقيع العقد وإيداع الدفعة الأولى، يُعيّن الطرف الثاني مديراً للمشروع ممثلاً له في هذا التعاقد.\n٢. يتم الاجتماع الأولي بين مدير المشروع الممثل للطرف الثاني ومدير المشروع الممثل للطرف الأول للاتفاق على آليات سير المشروع.\n٣. يتم توثيق جميع الخطوات والاتفاقات لضمان مصلحة طرفي المشروع.\n٤. يلتزم الطرف الثاني بإفادة الطرف الأول عن ملاحظاته حول الأعمال التي يتم تنفيذها في كل مرحلة خلال يومي عمل.', article_type: 'إدارة المشروع', is_locked: false, is_visible: true },
  { id: 'a7', order_index: 7, title_ar: 'آلية طلبات التغيير', body_ar: 'في حالة قيام الطرف الثاني بطلب تعديل على نطاق العمل المتفق عليه، يقوم الطرف الثاني بالاجتماع مع الطرف الأول لشرح المتطلبات الجديدة، ويقوم الطرف الأول بتقييم المتطلبات وتحديد الجهد والتكلفة المطلوبتين لتنفيذ المتطلبات الجديدة، ولا يُعدّ أي طلب تغيير ملزماً إلا بعد توقيع ملحق تعديل من الطرفين.', article_type: 'طلبات التغيير', is_locked: false, is_visible: true },
  { id: 'a8', order_index: 8, title_ar: 'إنهاء الاتفاقية', body_ar: 'تنتهي هذه الاتفاقية في الحالات التالية:\n١. باكتمال المشروع وتسليمه بشكل نهائي.\n٢. باتفاق الطرفين على إنهاء المشروع قبل تنفيذه لأسباب يتفق عليها الطرفان كتابياً.\n٣. يحق لكلا الطرفين إنهاء العقد إذا أخل الطرف الآخر ببنوده بعد إنذار كتابي لمدة لا تقل عن شهر.\n٤. إذا لم يلتزم الطرف الثاني بإيداع الدفعة خلال أسبوعين من تاريخ استحقاقها.', article_type: 'إنهاء الاتفاقية', is_locked: false, is_visible: true },
  { id: 'a9', order_index: 9, title_ar: 'أحكام عامة', body_ar: '١. يلتزم الطرفان بالأحكام والضوابط الشرعية في تنفيذ الأعمال الفنية.\n٢. يُقر الطرفان بأنهما قد اطلعا على كل بنود ومحتوى هذا العقد وتفهماها وأدركا مقاصدها إدراكاً نافياً للجهالة والغرر.\n٣. يكون العنوان النظامي لكل طرف هو العنوان المبين في تمهيد هذا العقد.\n٤. لا يُعتدّ بتعديل أي شرط من شروط هذا العقد ما لم يكن مكتوباً بملحق وموقعاً عليه من الطرفين.\n٥. يُعدّ هذا العقد ومالحقه نهائياً وملزماً للطرفين من تاريخ إبرام العقد وملغياً لأي عقد أو اتفاق سابق.', article_type: 'أحكام عامة', is_locked: true, is_visible: true },
  { id: 'a10', order_index: 10, title_ar: 'نُسخ الاتفاقية', body_ar: 'حُرّر هذا العقد من عشرة بنود بنسختين أصليتين باللغة العربية، واستلم كل طرف نسخةً للعمل بموجبها، ويُعتبر توقيع الطرفين على هذا العقد إقراراً بصحته، وأن أي كشط أو تعديل غير متفق عليه من الطرفين يكون سبباً في إلغاء هذا العقد.\nوتوثيقاً لما تقدم فقد جرى التوقيع عليه في اليوم والسنة المبيَّنين في تمهيده.\nوالله ولي التوفيق.', article_type: 'نسخ الاتفاقية', is_locked: true, is_visible: true },
];

const DEFAULT_PAYMENT_BASE = { subtotal_sar: 0, vat_rate: 15, vat_amount: 0, total_sar: 0, bank_iban: 'SA865134841770007', bank_name: 'بنك البلاد', account_holder: 'شركة دراية الذكية لتقنية المعلومات', tasks: [] };

const SEED_SETTINGS: AppSettings = { entities: [{ id: 'e1', name_ar: 'شركة دراية الذكية للتقنية', cr_number: '2051235281', representative_name: 'براء المنجد', representative_title: 'المدير العام', address: 'طريق الظهران – حي القصور', city: 'الخبر', postal_code: '31952', po_box: '', phone: '0138655355', email: 'baraa@dirayaah.com', logo_base64: undefined, primary_color: '#059669', secondary_color: '#f0fdf4', accent_color: '#064e3b', bank_iban: 'SA865134841770007', bank_name: 'بنك البلاد', account_holder: 'شركة دراية الذكية لتقنية المعلومات', is_default: true }], default_vat_rate: 15 };

const SEED_TEMPLATES: ContractTemplate[] = [
  { id: 't1', name_ar: 'عقد تطوير منصة', category: 'تطوير برمجيات', description: 'قالب لعقود تطوير المنصات البرمجية مع دفعات ثلاث (40/40/20)', default_status: 'مسودة', default_type: 'تطوير برمجيات', default_articles: DEFAULT_ARTICLES, default_appendices: [], default_payment_schedule: { ...DEFAULT_PAYMENT_BASE, installments: [{ id: 'i1', label_ar: 'الدفعة الأولى', trigger_event: 'توقيع العقد', percentage: 40, amount_sar: 0, amount_words_ar: 'صفر ريال سعودي' }, { id: 'i2', label_ar: 'الدفعة الثانية', trigger_event: 'الإطلاق التجريبي', percentage: 40, amount_sar: 0, amount_words_ar: 'صفر ريال سعودي' }, { id: 'i3', label_ar: 'الدفعة الأخيرة', trigger_event: 'الإطلاق النهائي', percentage: 20, amount_sar: 0, amount_words_ar: 'صفر ريال سعودي' }] }, tags: ['تطوير', 'منصة'], is_default: true },
  { id: 't2', name_ar: 'عقد تطوير تطبيق', category: 'تطوير برمجيات', description: 'قالب لعقود تطوير تطبيقات الجوال مع دفعتين (50/50)', default_status: 'مسودة', default_type: 'تطوير برمجيات', default_articles: DEFAULT_ARTICLES, default_appendices: [], default_payment_schedule: { ...DEFAULT_PAYMENT_BASE, installments: [{ id: 'i1', label_ar: 'الدفعة الأولى', trigger_event: 'توقيع العقد', percentage: 50, amount_sar: 0, amount_words_ar: 'صفر ريال سعودي' }, { id: 'i2', label_ar: 'الدفعة الأخيرة', trigger_event: 'رفع التطبيق للمتاجر', percentage: 50, amount_sar: 0, amount_words_ar: 'صفر ريال سعودي' }] }, tags: ['تطوير', 'تطبيق'] },
  { id: 't3', name_ar: 'عقد اشتراك سنوي', category: 'اشتراك/SaaS', description: 'قالب لعقود الاشتراك في خدمات SaaS بدفعة واحدة', default_status: 'مسودة', default_type: 'اشتراك/SaaS', default_articles: DEFAULT_ARTICLES, default_appendices: [], default_payment_schedule: { ...DEFAULT_PAYMENT_BASE, installments: [{ id: 'i1', label_ar: 'دفعة الاشتراك', trigger_event: 'توقيع العقد', percentage: 100, amount_sar: 0, amount_words_ar: 'صفر ريال سعودي' }] }, tags: ['SaaS', 'اشتراك'] },
  { id: 't4', name_ar: 'عقد إنتاج محتوى', category: 'إنتاج محتوى', description: 'قالب لعقود إنتاج المحتوى الرقمي مع دفعتين (50/50)', default_status: 'مسودة', default_type: 'إنتاج محتوى', default_articles: DEFAULT_ARTICLES, default_appendices: [], default_payment_schedule: { ...DEFAULT_PAYMENT_BASE, installments: [{ id: 'i1', label_ar: 'الدفعة الأولى', trigger_event: 'توقيع العقد', percentage: 50, amount_sar: 0, amount_words_ar: 'صفر ريال سعودي' }, { id: 'i2', label_ar: 'الدفعة الأخيرة', trigger_event: 'تسليم المحتوى', percentage: 50, amount_sar: 0, amount_words_ar: 'صفر ريال سعودي' }] }, tags: ['محتوى'] },
  { id: 't5', name_ar: 'عقد مختلط', category: 'مختلط', description: 'قالب مرن للعقود المختلطة — قابل للتعديل الكامل', default_status: 'مسودة', default_type: 'مختلط', default_articles: DEFAULT_ARTICLES, default_appendices: [], default_payment_schedule: { ...DEFAULT_PAYMENT_BASE, installments: [] }, tags: ['مختلط'] },
];

const SEED_CLIENTS: Client[] = [
  { id: 'c1', name_ar: 'شركة التقنية المتقدمة', entity_type: 'شركة', license_authority: 'وزارة التجارة والصناعة', license_no: '1010123456', representative_name: 'أحمد محمد العمري', representative_title: 'المدير التنفيذي', national_id: '1012345678', address: 'طريق الملك فهد – حي العليا', city: 'الرياض', postal_code: '12211', phone: '0112345678', email: 'ahmed@advtech.sa' },
  { id: 'c2', name_ar: 'جمعية الأفق التعليمية', entity_type: 'جمعية', license_authority: 'وزارة الموارد البشرية', license_no: '4030098765', representative_name: 'سارة خالد الزهراني', representative_title: 'رئيس مجلس الإدارة', national_id: '1098765432', address: 'طريق الأمير سلطان – حي الحمراء', city: 'جدة', postal_code: '23521', phone: '0126543210', email: 'sara@ufuq.edu.sa' },
  { id: 'c3', name_ar: 'مؤسسة بناء الرقمية', entity_type: 'شركة', license_authority: 'وزارة التجارة والصناعة', license_no: '2051098765', representative_name: 'فهد عبدالله القحطاني', representative_title: 'المدير العام', national_id: '1055432198', address: 'طريق الظهران – حي القصور', city: 'الخبر', postal_code: '31952', phone: '0138765432', email: 'fahad@banadigital.sa' },
];

const SEED_PROJECTS: Project[] = [
  { id: 'p1', name_ar: 'تطوير منصة قدوتي', project_type: 'تطوير منصة', client_id: 'c1', amount_sar: 100000, status: 'مخطط', description: 'تطوير الإصدار الثاني من منصة وتطبيق قدوتي', start_date: '2026-04-01' },
  { id: 'p2', name_ar: 'منصة الأفق التعليمية', project_type: 'اشتراك سنوي', client_id: 'c2', amount_sar: 8500, status: 'قيد التنفيذ', description: 'تهيئة وتشغيل منصة بساط لجمعية الأفق', start_date: '2026-01-15' },
  { id: 'p3', name_ar: 'تطبيق بناء العقاري', project_type: 'تطوير تطبيق', client_id: 'c3', amount_sar: 150000, status: 'مكتمل', description: 'تطبيق لإدارة الأملاك والعقارات', start_date: '2025-06-01' },
  { id: 'p4', name_ar: 'استشارات التحول الرقمي', project_type: 'استشارات', client_id: 'c1', amount_sar: 50000, status: 'معلّق', description: 'تقديم استشارات للتحول الرقمي', start_date: '2026-05-01' },
];

const articleSet = (title: string, party2: string): Article[] => DEFAULT_ARTICLES.map(a => {
  if (a.id === 'a2') return { ...a, body_ar: `${title} لصالح الطرف الثاني (${party2}) اعتماداً على العرض الفني المعتمد من قبل الطرفين والملحق مع هذا العقد.` };
  if (a.id === 'a3') return { ...a, body_ar: `يلتزم الطرف الأول بتنفيذ ${title} لصالح الطرف الثاني خلال مدة لا تزيد عن ستة أشهر من تاريخ توقيع العقد من كلا الطرفين وتحويل الدفعة الأولى لحساب الطرف الأول.` };
  return a;
});

const SEED_CONTRACTS: Contract[] = [
  { id: 'contract-001', entity_id: 'e1', project_id: 'p1', template_id: 't1', contract_number: 'CMS-2026-0001', title_ar: 'عقد تطوير تطبيق ومنصة قدوتي – الإصدار الثاني', type: 'تطوير برمجيات', status: 'مسودة', client_id: 'c1', start_date: '2026-04-01', end_date: '2026-10-01', tags: ['تطوير', '2026'], articles: articleSet('تطوير الإصدار الثاني من تطبيق ومنصة قدوتي', 'شركة التقنية المتقدمة'), payment_schedule: { subtotal_sar: 100000, vat_rate: 15, vat_amount: 15000, total_sar: 115000, bank_iban: 'SA865134841770007', bank_name: 'بنك البلاد', account_holder: 'شركة دراية الذكية لتقنية المعلومات', tasks: [{ id: 't1', task_name_ar: 'تصميم واجهات المستخدم (UI/UX)', duration: '30 يوم عمل', cost_sar: 20000, frequency: 'مرة واحدة' }, { id: 't2', task_name_ar: 'تطوير تطبيق الجوال (iOS & Android)', duration: '90 يوم عمل', cost_sar: 60000, frequency: 'مرة واحدة' }, { id: 't3', task_name_ar: 'تطوير لوحة الإدارة', duration: '30 يوم عمل', cost_sar: 20000, frequency: 'مرة واحدة' }], installments: [{ id: 'i1', label_ar: 'الدفعة الأولى', trigger_event: 'توقيع العقد', percentage: 30, amount_sar: 34500, amount_words_ar: 'أربعة وثلاثون ألفاً وخمسمائة ريال سعودي' }, { id: 'i2', label_ar: 'الدفعة الثانية', trigger_event: 'اعتماد المتطلبات', percentage: 30, amount_sar: 34500, amount_words_ar: 'أربعة وثلاثون ألفاً وخمسمائة ريال سعودي' }, { id: 'i3', label_ar: 'الدفعة الثالثة', trigger_event: 'التشغيل التجريبي', percentage: 20, amount_sar: 23000, amount_words_ar: 'ثلاثة وعشرون ألف ريال سعودي' }, { id: 'i4', label_ar: 'الدفعة الرابعة', trigger_event: 'الإطلاق الرسمي', percentage: 20, amount_sar: 23000, amount_words_ar: 'ثلاثة وعشرون ألف ريال سعودي' }] }, appendices: [{ id: 'app1', order_index: 1, title_ar: 'الملحق الأول: العرض الفني', body_ar: 'يتضمن هذا الملحق العرض الفني المفصّل لنطاق العمل والمتطلبات التقنية للمشروع المعتمد من قبل الطرفين.', appendix_type: 'العرض الفني' }], attachments: [], versions: [{ version_number: 1, created_at: new Date().toISOString(), change_summary: 'إنشاء العقد', snapshot: {} as any }] },
  { id: 'contract-002', entity_id: 'e1', project_id: 'p2', template_id: 't3', contract_number: 'CMS-2026-0002', title_ar: 'عقد تطوير منصة تعليمية رقمية مع اشتراك سنوي', type: 'اشتراك/SaaS', status: 'نشط', client_id: 'c2', start_date: '2026-01-15', end_date: '2027-01-15', tags: ['منصة تعليمية', '2026'], articles: articleSet('تطوير وتهيئة منصة تعليمية رقمية', 'جمعية الأفق التعليمية'), payment_schedule: { subtotal_sar: 8500, vat_rate: 15, vat_amount: 1275, total_sar: 9775, bank_iban: 'SA865134841770007', bank_name: 'بنك البلاد', account_holder: 'شركة دراية الذكية لتقنية المعلومات', tasks: [{ id: 't1', task_name_ar: 'تهيئة نسخة المنصة (بساط)', duration: '30 يوم عمل', cost_sar: 2000, frequency: 'مرة واحدة' }, { id: 't2', task_name_ar: 'رفع التطبيق على متاجر Apple و Google', duration: 'ضمن المدة', cost_sar: 0, frequency: 'مرة واحدة' }, { id: 't3', task_name_ar: 'اشتراك سنوي (استضافة + دعم + تحديثات)', duration: 'سنوي', cost_sar: 1000, frequency: 'سنوي' }, { id: 't4', task_name_ar: 'تهيئة برمجية مخصصة', duration: '120 يوم عمل', cost_sar: 3813, frequency: 'مرة واحدة' }, { id: 't5', task_name_ar: 'تدريب إلكتروني', duration: 'ضمن المدة', cost_sar: 1687, frequency: 'مرة واحدة' }], installments: [{ id: 'i1', label_ar: 'الدفعة الأولى (20%)', trigger_event: 'توقيع العقد', percentage: 20, amount_sar: 1955, amount_words_ar: 'ألف وتسعمائة وخمسة وخمسون ريال سعودي' }, { id: 'i2', label_ar: 'الدفعة الثانية (20%)', trigger_event: 'اعتماد المتطلبات', percentage: 20, amount_sar: 1955, amount_words_ar: 'ألف وتسعمائة وخمسة وخمسون ريال سعودي' }, { id: 'i3', label_ar: 'الدفعة الثالثة (40%)', trigger_event: 'الإطلاق الرسمي', percentage: 40, amount_sar: 3910, amount_words_ar: 'ثلاثة آلاف وتسعمائة وعشرة ريال سعودي' }, { id: 'i4', label_ar: 'الدفعة الرابعة (20%)', trigger_event: 'بعد 360 يوم', percentage: 20, amount_sar: 1955, amount_words_ar: 'ألف وتسعمائة وخمسة وخمسون ريال سعودي' }] }, appendices: [{ id: 'app1', order_index: 1, title_ar: 'الملحق الأول: الخدمات', body_ar: 'تهيئة نسخة بساط للطرف الثاني:\n١. تصميم وتهيئة واجهة المنصة وفقاً للهوية اللونية.', appendix_type: 'قائمة الخدمات' }], attachments: [{ id: 'att1', title: 'العرض الفني المعتمد', file_type: 'PDF', attachment_type: 'العرض الفني', uploaded_at: '2026-01-10' }], versions: [{ version_number: 1, created_at: '2026-01-10T10:00:00Z', change_summary: 'الإصدار الأول', snapshot: {} as any }] },
];

type StepStatus = 'idle' | 'running' | 'done' | 'error' | 'skipped';
interface SeedStep { id: string; label: string; status: StepStatus; detail: string; }
const INITIAL_STEPS: SeedStep[] = [
  { id: 'check', label: 'فحص قاعدة البيانات', status: 'idle', detail: '' },
  { id: 'settings', label: 'إعدادات الجهة (cms_settings)', status: 'idle', detail: '' },
  { id: 'templates', label: 'القوالب (cms_templates)', status: 'idle', detail: '' },
  { id: 'clients', label: 'العملاء (cms_clients)', status: 'idle', detail: '' },
  { id: 'projects', label: 'المشاريع (cms_projects)', status: 'idle', detail: '' },
  { id: 'contracts', label: 'العقود النموذجية (cms_contracts)', status: 'idle', detail: '' },
];

export default function CMSSeedPage() {
  const [steps, setSteps] = useState<SeedStep[]>(INITIAL_STEPS);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const update = (id: string, status: StepStatus, detail = '') =>
    setSteps(s => s.map(step => step.id === id ? { ...step, status, detail } : step));

  const runSeed = async () => {
    setRunning(true); setDone(false);
    try {
      update('check', 'running');
      const existing = await getDocs(query(collection(db, 'cms_templates'), limit(1)));
      update('check', 'done', existing.empty ? 'قاعدة البيانات فارغة — سيتم إنشاء البيانات' : 'تحتوي على بيانات — سيتم التحديث (idempotent)');
      update('settings', 'running');
      await setDoc(doc(db, 'cms_settings', 'entities'), SEED_SETTINGS);
      update('settings', 'done', 'تم حفظ بيانات الجهة الافتراضية (دراية الذكية)');
      update('templates', 'running');
      for (const t of SEED_TEMPLATES) await setDoc(doc(db, 'cms_templates', t.id), t);
      update('templates', 'done', `تم حفظ ${SEED_TEMPLATES.length} قوالب — كل قالب يحتوي على ${DEFAULT_ARTICLES.length} بنود افتراضية`);
      update('clients', 'running');
      for (const c of SEED_CLIENTS) await setDoc(doc(db, 'cms_clients', c.id), c);
      update('clients', 'done', `تم حفظ ${SEED_CLIENTS.length} عملاء`);
      update('projects', 'running');
      for (const p of SEED_PROJECTS) await setDoc(doc(db, 'cms_projects', p.id), p);
      update('projects', 'done', `تم حفظ ${SEED_PROJECTS.length} مشاريع`);
      update('contracts', 'running');
      for (const c of SEED_CONTRACTS) await setDoc(doc(db, 'cms_contracts', c.id), c);
      update('contracts', 'done', `تم حفظ ${SEED_CONTRACTS.length} عقود نموذجية`);
      setDone(true);
    } catch (err: any) {
      const failed = steps.find(s => s.status === 'running');
      if (failed) update(failed.id, 'error', err?.message || 'خطأ غير معروف');
      console.error('[CMSSeedPage] seed error:', err);
    } finally { setRunning(false); }
  };

  const stepIcon = (status: StepStatus) => {
    if (status === 'done') return <CheckCircle size={18} className="text-emerald-600 shrink-0" />;
    if (status === 'error') return <AlertCircle size={18} className="text-red-500 shrink-0" />;
    if (status === 'running') return <Loader size={18} className="text-blue-500 shrink-0 animate-spin" />;
    if (status === 'skipped') return <ChevronRight size={18} className="text-slate-300 shrink-0" />;
    return <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-200 shrink-0" />;
  };

  return (
    <div className="p-8 max-w-2xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-2">
        <Database size={28} className="text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-800">إعداد قاعدة البيانات</h1>
      </div>
      <p className="text-slate-500 mb-8 text-sm">يقوم هذا الإجراء بنقل البيانات الأساسية إلى Firestore — القوالب مع بنودها الكاملة، العملاء، المشاريع، وعقدين نموذجيين، وإعدادات الجهة الافتراضية. العملية آمنة وقابلة للتكرار (idempotent).</p>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-8 text-sm text-amber-800">
        <strong>ملاحظة:</strong> تشغيل هذا الإجراء مرة أخرى سيُحدّث البيانات الموجودة بالقيم الافتراضية للمعرّفات المتداخلة (t1–t5، c1–c3، p1–p4).
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-800">خطوات التهيئة</h2></div>
        <div className="divide-y divide-slate-100">
          {steps.map(step => (
            <div key={step.id} className="flex items-start gap-4 px-6 py-4">
              <div className="mt-0.5">{stepIcon(step.status)}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.status === 'error' ? 'text-red-700' : 'text-slate-800'}`}>{step.label}</p>
                {step.detail && <p className={`text-xs mt-1 ${step.status === 'error' ? 'text-red-600' : 'text-slate-500'}`}>{step.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
      {done && <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 mb-6 text-emerald-800 text-sm"><strong>اكتملت التهيئة بنجاح ✓</strong> — يمكنك الآن التنقل إلى أي قسم من نظام إدارة العقود.</div>}
      <button onClick={runSeed} disabled={running} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors">
        {running ? <Loader size={18} className="animate-spin" /> : <Database size={18} />}
        <span>{running ? 'جارٍ التهيئة...' : done ? 'إعادة التهيئة' : 'بدء التهيئة'}</span>
      </button>
    </div>
  );
}
