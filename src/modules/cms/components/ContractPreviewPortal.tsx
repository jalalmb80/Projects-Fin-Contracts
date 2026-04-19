/**
 * ContractPreviewPortal
 *
 * Used by ContractsList for two cases:
 *   1. preview mode  — full-screen modal with Print + Download buttons
 *   2. download mode — renders hidden, captures PDF, then auto-closes
 *
 * Reuses the ContractPreview rendering logic from ContractEditor without
 * importing the full 87 kB editor bundle.
 */
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FileDown } from 'lucide-react';
import { Contract, Article, Appendix, Attachment, Installment, TaskRow, ArticleBlock } from '../types';
import { useSettings } from '../context/SettingsContext';
import { useLang, t } from '../context/LanguageContext';
import { exportContractToPdf } from '../utils/exportPdf';
import { toHijri } from '../utils/hijriDate';

const PREVIEW_ID = 'contract-preview-list';

interface Props {
  contract: Contract;
  clients: any[];
  downloadMode: boolean;       // true → hidden render, auto PDF, then close
  onClose: () => void;
  onReady: (mode: 'download' | 'preview') => void;
}

export function ContractPreviewPortal({ contract, clients, downloadMode, onClose, onReady }: Props) {
  const { lang } = useLang();
  const { getDefaultEntity, getEntityById } = useSettings();
  const entity  = (contract.entity_id ? getEntityById(contract.entity_id) : null) || getDefaultEntity();
  const colors  = { primary: entity.primary_color, secondary: entity.secondary_color, accent: entity.accent_color };
  const client  = (clients || []).find((c: any) => c.id === contract.client_id);
  const schedule = contract.payment_schedule;
  const visibleArticles = (contract.articles || [])
    .filter((a: Article) => a.is_visible)
    .sort((a: Article, b: Article) => a.order_index - b.order_index);

  const triggered = useRef(false);

  // Auto-trigger PDF download after layout settles
  useEffect(() => {
    if (!downloadMode || triggered.current) return;
    triggered.current = true;
    // Two rAF + 300 ms to let fonts/images settle
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setTimeout(() => onReady('download'), 300)
      )
    );
  }, [downloadMode, onReady]);

  const san = (n: string) => n.replace(/[\/\\?%*:|"<>]/g, '-').trim();

  const handleDownload = async () => {
    try {
      await exportContractToPdf(PREVIEW_ID, {
        filename: san(`${contract.contract_number}-${contract.title_ar}.pdf`),
      });
    } catch (e) {
      console.error('[ContractPreviewPortal] export failed:', e);
    }
  };

  const arNums: Record<number, string> = {
    1:'بند واحد',2:'بندين',3:'ثلاثة بنود',4:'أربعة بنود',5:'خمسة بنود',
    6:'ستة بنود',7:'سبعة بنود',8:'ثمانية بنود',9:'تسعة بنود',10:'عشرة بنود',
    11:'أحد عشر بنداً',12:'اثني عشر بنداً',13:'ثلاثة عشر بنداً',
    14:'أربعة عشر بنداً',15:'خمسة عشر بنداً',
  };
  const countLabel = arNums[visibleArticles.length] || `${visibleArticles.length} بنود`;
  const repl = (s: string) =>
    s.replace(/\b(واحد|اثنين|ثلاثة|أربعة|خمسة|ستة|سبعة|ثمانية|تسعة|عشرة|أحد عشر|اثني عشر|ثلاثة عشر|أربعة عشر|خمسة عشر)\s+بند[اً]?/g, countLabel);

  // ── Preview HTML — identical to ContractPreview in ContractEditor ──────────
  const previewContent = (
    <div
      id={PREVIEW_ID}
      className="bg-white shadow-xl border border-slate-200 p-12 max-w-4xl mx-auto text-slate-900 contract-pdf-ready"
      dir="rtl"
      style={{ fontFamily: "'Tajawal', sans-serif" }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          {entity.logo_base64
            ? <img src={entity.logo_base64} alt="logo" className="h-20 max-w-[180px] object-contain" />
            : <div className="h-20 w-[180px]" />}
        </div>
        <div className="text-left text-sm text-slate-500 leading-6">
          <p>{entity.name_ar}</p>
          <p>{t('س.ت', 'CR', lang)}: {entity.cr_number}</p>
          <p>{entity.city}</p>
        </div>
      </div>

      {/* Title block */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-6">بسم الله الرحمن الرحيم</h1>
        <h2 className="text-xl font-bold">{contract.title_ar}</h2>
        <p className="text-sm text-slate-500 mt-2">
          {t('رقم العقد', 'Contract No.', lang)}: {contract.contract_number}
        </p>
        <p className="text-sm text-slate-500">
          {t('الميلادي', 'Date', lang)}: {contract.start_date} |{' '}
          {t('الهجري', 'Hijri', lang)}: {toHijri(contract.start_date)}
        </p>
      </div>

      {/* Parties */}
      <div className="mb-10 leading-relaxed text-lg">
        <p className="mb-4">
          {t('إنه في يوم الموافق', 'On this day', lang)} {contract.start_date}،{' '}
          {t('تم الاتفاق بين كل من', 'an agreement was made between', lang)}:
        </p>

        <div className="mb-6 bg-slate-50 p-4 rounded border border-slate-100">
          <p className="font-bold mb-2" style={{ color: colors.primary }}>
            {t('الطرف الأول', 'Party One', lang)}: {entity.name_ar}
          </p>
          <div className="grid grid-cols-2 gap-2 text-base">
            <p>{t('سجل تجاري رقم', 'CR No.', lang)}: {entity.cr_number}</p>
            <p>{t('ويمثلها', 'Represented by', lang)}: {entity.representative_name} ({entity.representative_title})</p>
            <p>{t('العنوان', 'Address', lang)}: {entity.city} – {entity.address}</p>
            <p>{t('البريد', 'Email', lang)}: {entity.email}</p>
          </div>
        </div>

        <div className="mb-6 bg-slate-50 p-4 rounded border border-slate-100">
          {client ? (
            <>
              <p className="font-bold mb-3" style={{ color: colors.primary }}>
                {t('الطرف الثاني', 'Party Two', lang)}: {client.name_ar}
              </p>
              <div className="grid grid-cols-2 gap-2 text-base">
                <p>{t('السجل التجاري', 'CR', lang)}: {client.license_no || '—'}</p>
                <p>{t('ويمثلها', 'Rep.', lang)}: {client.representative_name || '—'} — {client.representative_title || '—'}</p>
                <p>{t('المدينة', 'City', lang)}: {client.city || '—'}</p>
                <p>{t('العنوان', 'Address', lang)}: {client.address || '—'}</p>
                {client.phone && <p>{t('الهاتف', 'Phone', lang)}: <span dir="ltr">{client.phone}</span></p>}
                {client.email && <p>{t('البريد', 'Email', lang)}: <span dir="ltr">{client.email}</span></p>}
              </div>
            </>
          ) : (
            <p className="text-amber-600 font-medium">
              ⚠️ {t('لم يتم تحديد العميل', 'No client selected', lang)}
            </p>
          )}
        </div>
      </div>

      {/* Articles */}
      <div className="space-y-8 text-lg">
        {visibleArticles.map((article: Article, idx: number) => {
          const displayBody = article.article_type === 'نسخ الاتفاقية'
            ? repl(article.body_ar || '')
            : (article.body_ar || t('(نص البند فارغ)', '(empty)', lang));

          return (
            <div key={article.id} className="article-block">
              <h3 className="text-xl font-bold mb-3" style={{ color: colors.accent }}>
                {t('البند', 'Article', lang)} {idx + 1}: {article.title_ar}
              </h3>

              {article.blocks && article.blocks.length > 0 ? (
                <div className="space-y-4">
                  {article.blocks.map((block: ArticleBlock) => {
                    if (block.type === 'paragraph') {
                      const bt = article.article_type === 'نسخ الاتفاقية'
                        ? repl((block as any).text_ar || '')
                        : (block as any).text_ar;
                      return <p key={block.id} className="whitespace-pre-wrap leading-relaxed text-justify">{bt}</p>;
                    }
                    if (block.type === 'list') {
                      const bl = block as any;
                      const LT = bl.style === 'ordered' || bl.style === 'alpha' ? 'ol' : 'ul';
                      const lc = bl.style === 'ordered' ? 'list-decimal' : bl.style === 'alpha' ? 'list-[lower-alpha]' : 'list-disc';
                      return (
                        <LT key={block.id} className={`${lc} list-inside space-y-2 mr-4 leading-relaxed text-justify`}>
                          {bl.items.map((i: any) => <li key={i.id}>{i.text_ar}</li>)}
                        </LT>
                      );
                    }
                    if (block.type === 'page_break') {
                      return <div key={block.id} className="contract-page-break" />;
                    }
                    return null;
                  })}
                </div>
              ) : (
                <div className="whitespace-pre-wrap leading-relaxed text-justify">{displayBody}</div>
              )}

              {/* Payment schedule table — only in القيمة والدفعات */}
              {article.article_type === 'القيمة والدفعات' && schedule.tasks.length > 0 && (
                <div className="mt-6">
                  <table className="w-full border-collapse border border-slate-300 mb-6 text-base">
                    <thead style={{ backgroundColor: colors.primary }}>
                      <tr>
                        {[t('المهمة','Task',lang), t('المدة','Duration',lang), t('التكلفة (ريال)','Cost (SAR)',lang)].map(h => (
                          <th key={h} className="border border-slate-300 px-4 py-2 text-right text-white font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.tasks.map((task: TaskRow, i: number) => (
                        <tr key={task.id} style={{ backgroundColor: i % 2 === 0 ? colors.secondary : '#fff' }}>
                          <td className="border border-slate-300 px-4 py-2">{task.task_name_ar}</td>
                          <td className="border border-slate-300 px-4 py-2">{task.duration}</td>
                          <td className="border border-slate-300 px-4 py-2">{task.cost_sar.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                      <tr>
                        <td colSpan={2} className="border border-slate-300 px-4 py-2">{t('الإجمالي غير شامل الضريبة','Subtotal excl. VAT',lang)}</td>
                        <td className="border border-slate-300 px-4 py-2">{schedule.subtotal_sar.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="border border-slate-300 px-4 py-2">{t('ضريبة القيمة المضافة','VAT',lang)} ({schedule.vat_rate}%)</td>
                        <td className="border border-slate-300 px-4 py-2">{schedule.vat_amount.toLocaleString()}</td>
                      </tr>
                      <tr style={{ backgroundColor: colors.secondary }}>
                        <td colSpan={2} className="border border-slate-300 px-4 py-2" style={{ color: colors.accent }}>{t('الإجمالي الكلي','Total',lang)}</td>
                        <td className="border border-slate-300 px-4 py-2" style={{ color: colors.accent }}>{schedule.total_sar.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>

                  {schedule.installments.length > 0 && (
                    <div className="mb-6">
                      <p className="font-bold mb-2">{t('طريقة الدفع','Payment schedule',lang)}:</p>
                      <ul className="list-disc list-inside space-y-4 mr-4">
                        {schedule.installments.map((inst: Installment) => (
                          <li key={inst.id}>
                            <span className="font-bold">{inst.label_ar}</span>: {inst.percentage}%{' '}
                            {t('تستحق عند','due at',lang)} {inst.trigger_event}.
                            <div className="mt-1 text-slate-700">
                              {t('المبلغ','Amount',lang)}: {inst.amount_sar.toLocaleString()} {t('ريال','SAR',lang)} ({inst.amount_words_ar})
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-4 border border-slate-200 rounded text-base" style={{ backgroundColor: colors.secondary }}>
                    <p className="font-bold mb-2">{t('البيانات البنكية','Bank Details',lang)}:</p>
                    <p>{t('اسم البنك','Bank',lang)}: {schedule.bank_name}</p>
                    <p>{t('اسم الحساب','Account',lang)}: {schedule.account_holder}</p>
                    <p>{t('رقم الآيبان','IBAN',lang)}: <span dir="ltr">{schedule.bank_iban}</span></p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Signatures */}
        <div className="mt-24 grid grid-cols-2 gap-12 text-center text-lg signature-block">
          <div>
            <p className="font-bold mb-8">{t('الطرف الأول','Party One',lang)}</p>
            <p>{t('الاسم','Name',lang)}: {entity.representative_name}</p>
            <p className="mt-4">{t('التوقيع','Signature',lang)}: ___________________</p>
          </div>
          <div>
            <p className="font-bold mb-8">{t('الطرف الثاني','Party Two',lang)}</p>
            <p>{t('الاسم','Name',lang)}: {client?.representative_name || '—'}</p>
            <p className="mt-4">{t('التوقيع','Signature',lang)}: ___________________</p>
          </div>
        </div>

        {/* Appendices */}
        {(contract.appendices || []).map((app: Appendix, idx: number) => (
          <div
            key={app.id}
            className="contract-page-break"
            style={{ pageBreakBefore: 'always', marginTop: '48px', paddingTop: '32px', borderTop: '2px solid #1e293b' }}
          >
            {idx === 0 && (
              <h2 className="text-2xl font-bold mb-8 text-center">{t('الملاحق','Appendices',lang)}</h2>
            )}
            <h3 className="text-xl font-bold mb-3" style={{ color: colors.accent }}>
              {t('الملحق','Appendix',lang)} {idx + 1}: {app.title_ar}
            </h3>
            <div className="whitespace-pre-wrap leading-relaxed text-justify">
              {app.body_ar || t('(نص الملحق فارغ)','(empty)',lang)}
            </div>
          </div>
        ))}

        {/* Attachments table */}
        {(contract.attachments || []).length > 0 && (
          <div
            className="contract-page-break"
            style={{ pageBreakBefore: 'always', marginTop: '48px', paddingTop: '32px', borderTop: '2px solid #1e293b' }}
          >
            <h2 className="text-2xl font-bold mb-8 text-center">{t('المرفقات','Attachments',lang)}</h2>
            <table className="w-full border-collapse border border-slate-300 text-base">
              <thead style={{ backgroundColor: colors.primary }}>
                <tr>
                  {[t('اسم المرفق','Title',lang),t('النوع','Type',lang),t('التاريخ','Date',lang)].map(h => (
                    <th key={h} className="border border-slate-300 px-4 py-2 text-right text-white font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contract.attachments.map((att: Attachment, i: number) => (
                  <tr key={att.id} style={{ backgroundColor: i % 2 === 0 ? colors.secondary : '#fff' }}>
                    <td className="border border-slate-300 px-4 py-2">{att.title}</td>
                    <td className="border border-slate-300 px-4 py-2">{att.attachment_type}</td>
                    <td className="border border-slate-300 px-4 py-2">{att.uploaded_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // ── Download mode: render hidden, let parent trigger PDF export ─────────────
  if (downloadMode) {
    return createPortal(
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: '-9999px',
          width: '960px',
          overflow: 'visible',
          pointerEvents: 'none',
          zIndex: -1,
          background: '#fff',
        }}
      >
        {previewContent}
      </div>,
      document.body,
    );
  }

  // ── Preview mode: full-screen modal ─────────────────────────────────────────
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/60"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 no-print">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-800 text-sm">{contract.contract_number}</span>
          <span className="text-slate-400 text-sm">—</span>
          <span className="text-slate-600 text-sm">{contract.title_ar}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <FileDown size={16} />
            {t('تحميل PDF', 'Download PDF', lang)}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Printer size={16} />
            {t('طباعة', 'Print', lang)}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Scrollable preview area */}
      <div className="flex-1 overflow-auto bg-slate-100 p-8">
        {previewContent}
      </div>
    </div>,
    document.body,
  );
}
