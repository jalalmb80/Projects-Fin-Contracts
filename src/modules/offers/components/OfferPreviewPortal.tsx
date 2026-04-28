/**
 * OfferPreviewPortal
 *
 * Renders a print-ready offer document and provides PDF export.
 *
 * Two modes:
 *   'preview'  — full-screen modal; toolbar has Download PDF + Print + Close.
 *   'download' — hidden off-screen render; auto-exports PDF after layout
 *               settles, then calls onClose. Used by the "Quick Download"
 *               button in the builder top bar.
 *
 * Section-type-aware rendering:
 *   cover_page      → styled cover with offer metadata + status
 *   pricing_table   → live line-items table with subtotal / VAT / total
 *   payment_schedule → totals summary + scheduled-payment note
 *   signature_block → two-column signature area
 *   all others      → <h2> title + content (dangerouslySetInnerHTML)
 *
 * Bilingual: offer.language drives dir, section title field, and locale.
 */
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FileDown } from 'lucide-react';
import {
  Offer, OfferSection, LineItem,
  STATUS_LABELS, SECTION_TYPE_LABELS,
} from '../types';
import { exportOfferToPdf } from '../utils/exportPdf';
import { formatCurrency } from '../utils/pricing';

const PREVIEW_ID = 'offer-preview-document';

interface Props {
  offer:    Offer;
  mode:     'preview' | 'download';
  onClose:  () => void;
}

export default function OfferPreviewPortal({ offer, mode, onClose }: Props) {
  const triggered = useRef(false);
  const isAr      = offer.language === 'ar';
  const dir       = isAr ? 'rtl' : 'ltr';

  // ── Auto-trigger in download mode ─────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'download' || triggered.current) return;
    triggered.current = true;
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        setTimeout(async () => {
          try {
            const safe = (s: string) => s.replace(/[\/\\?%*:|"<>]/g, '-').trim();
            await exportOfferToPdf(PREVIEW_ID, {
              filename: safe(`${offer.offer_number}-${isAr ? offer.title_ar : offer.title_en}.pdf`),
            });
          } catch (err) {
            console.error('[OfferPreviewPortal] auto-download failed:', err);
          } finally {
            onClose();
          }
        }, 300),
      ),
    );
  }, [mode]);

  // ── ESC to close ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'preview') return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [mode, onClose]);

  const handleDownload = async () => {
    try {
      const safe = (s: string) => s.replace(/[\/\\?%*:|"<>]/g, '-').trim();
      await exportOfferToPdf(PREVIEW_ID, {
        filename: safe(`${offer.offer_number}-${isAr ? offer.title_ar : offer.title_en}.pdf`),
      });
    } catch (err) {
      console.error('[OfferPreviewPortal] download failed:', err);
    }
  };

  // ── Sorted visible sections ────────────────────────────────────────────────
  const sections = [...offer.sections]
    .filter(s => s.is_visible)
    .sort((a, b) => a.position - b.position);

  const hasCover = sections.some(s => s.type === 'cover_page');

  // ── Section title helper ──────────────────────────────────────────────────
  const sectionTitle = (s: OfferSection): string =>
    isAr ? (s.title_ar || SECTION_TYPE_LABELS[s.type]?.ar || s.title_en)
          : (s.title_en || SECTION_TYPE_LABELS[s.type]?.en || s.title_ar);

  // ── Status badge ──────────────────────────────────────────────────────────
  const statusMeta  = STATUS_LABELS[offer.status];
  const statusLabel = isAr ? statusMeta.ar : statusMeta.en;

  // ── Pricing table ─────────────────────────────────────────────────────────
  const PricingTable = () => {
    const included = offer.line_items.filter(i => i.is_included);
    if (included.length === 0) {
      return (
        <p style={{ color: '#64748b', fontStyle: 'italic' }}>
          {isAr ? 'لا توجد بنود تسعير' : 'No pricing items added.'}
        </p>
      );
    }
    return (
      <table style={{
        width: '100%', borderCollapse: 'collapse',
        fontSize: '13px', marginTop: '12px',
      }}>
        <thead>
          <tr style={{ backgroundColor: '#1e293b', color: '#fff' }}>
            {[
              isAr ? 'البند'        : 'Item',
              isAr ? 'الكمية'       : 'Qty',
              isAr ? 'الوحدة'       : 'Unit',
              isAr ? 'سعر الوحدة'   : 'Unit Price',
              isAr ? 'الخصم %'      : 'Disc %',
              isAr ? 'الإجمالي'     : 'Total',
            ].map(h => (
              <th key={h} style={{
                padding: '8px 12px', textAlign: isAr ? 'right' : 'left',
                fontWeight: 600, border: '1px solid #334155',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {included.map((item: LineItem, i: number) => (
            <tr key={item.id} style={{ backgroundColor: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
              <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0' }}>
                <strong>{item.name}</strong>
                {item.description && (
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {item.description}
                  </div>
                )}
              </td>
              <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                {item.quantity}
              </td>
              <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                {item.unit}
              </td>
              <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0', textAlign: isAr ? 'right' : 'left' }}>
                {formatCurrency(item.unit_price, offer.currency)}
              </td>
              <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                {item.discount_pct > 0 ? `${item.discount_pct}%` : '—'}
              </td>
              <td style={{
                padding: '7px 12px', border: '1px solid #e2e8f0',
                textAlign: isAr ? 'right' : 'left', fontWeight: 600,
              }}>
                {formatCurrency(item.line_total, offer.currency)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: '#f1f5f9' }}>
            <td colSpan={5} style={{ padding: '7px 12px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
              {isAr ? 'المجموع الفرعي' : 'Subtotal'}
            </td>
            <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
              {formatCurrency(offer.subtotal, offer.currency)}
            </td>
          </tr>
          {offer.global_discount_pct > 0 && (
            <tr style={{ backgroundColor: '#fef9c3' }}>
              <td colSpan={5} style={{ padding: '7px 12px', border: '1px solid #e2e8f0' }}>
                {isAr ? `خصم (${offer.global_discount_pct}%)` : `Discount (${offer.global_discount_pct}%)`}
              </td>
              <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0', color: '#b45309' }}>
                -{formatCurrency(offer.discount_amount, offer.currency)}
              </td>
            </tr>
          )}
          <tr style={{ backgroundColor: '#f1f5f9' }}>
            <td colSpan={5} style={{ padding: '7px 12px', border: '1px solid #e2e8f0' }}>
              {isAr ? `ضريبة القيمة المضافة (${offer.vat_rate}%)` : `VAT (${offer.vat_rate}%)`}
            </td>
            <td style={{ padding: '7px 12px', border: '1px solid #e2e8f0' }}>
              {formatCurrency(offer.vat_amount, offer.currency)}
            </td>
          </tr>
          <tr style={{ backgroundColor: '#1e293b', color: '#fff' }}>
            <td colSpan={5} style={{
              padding: '9px 12px', border: '1px solid #334155',
              fontWeight: 700, fontSize: '14px',
            }}>
              {isAr ? 'الإجمالي الكلي' : 'Total'}
            </td>
            <td style={{
              padding: '9px 12px', border: '1px solid #334155',
              fontWeight: 700, fontSize: '14px',
            }}>
              {formatCurrency(offer.total_value, offer.currency)}
            </td>
          </tr>
        </tfoot>
      </table>
    );
  };

  // ── Signature block ────────────────────────────────────────────────────────
  const SignatureBlock = () => (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: '48px', marginTop: '48px', textAlign: 'center', fontSize: '14px',
    }}>
      <div>
        <p style={{ fontWeight: 700, marginBottom: '32px' }}>
          {isAr ? 'المورد' : 'Supplier'}
        </p>
        <p style={{ marginBottom: '48px' }}>
          {isAr ? 'الاسم: ______________________' : 'Name: ______________________'}
        </p>
        <p>{isAr ? 'التوقيع: ______________________' : 'Signature: ______________________'}</p>
        <p style={{ marginTop: '8px', color: '#64748b', fontSize: '12px' }}>
          {isAr ? 'التاريخ: ______________________' : 'Date: ______________________'}
        </p>
      </div>
      <div>
        <p style={{ fontWeight: 700, marginBottom: '32px' }}>
          {isAr ? 'العميل' : 'Client'}
        </p>
        <p style={{ marginBottom: '48px' }}>
          {offer.client_name
            ? (isAr ? `الاسم: ${offer.client_name}` : `Name: ${offer.client_name}`)
            : (isAr ? 'الاسم: ______________________' : 'Name: ______________________')}
        </p>
        <p>{isAr ? 'التوقيع: ______________________' : 'Signature: ______________________'}</p>
        <p style={{ marginTop: '8px', color: '#64748b', fontSize: '12px' }}>
          {isAr ? 'التاريخ: ______________________' : 'Date: ______________________'}
        </p>
      </div>
    </div>
  );

  // ── Section renderer ───────────────────────────────────────────────────────
  const renderSection = (section: OfferSection, idx: number) => {
    const title = sectionTitle(section);

    // Cover page: only renders the document metadata block; no body.
    if (section.type === 'cover_page') {
      return (
        <div key={section.id} style={{
          textAlign: 'center', padding: '48px 0 32px',
          borderBottom: '2px solid #1e293b', marginBottom: '32px',
        }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>
            {isAr ? offer.title_ar : offer.title_en}
          </h1>
          {offer.title_ar && offer.title_en && (
            <p style={{ fontSize: '16px', color: '#475569', marginBottom: '12px' }}>
              {isAr ? offer.title_en : offer.title_ar}
            </p>
          )}
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
            {isAr ? 'رقم العرض' : 'Offer No.'}: <strong style={{ color: '#1e293b' }}>{offer.offer_number}</strong>
          </p>
          {offer.client_name && (
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
              {isAr ? 'العميل' : 'Client'}: <strong style={{ color: '#1e293b' }}>{offer.client_name}</strong>
            </p>
          )}
          {offer.expiry_date && (
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
              {isAr ? 'تاريخ الانتهاء' : 'Valid until'}: <strong>{offer.expiry_date}</strong>
            </p>
          )}
          <div style={{ marginTop: '16px', display: 'inline-block' }}>
            <span style={{
              display: 'inline-block', padding: '4px 14px',
              borderRadius: '999px', fontSize: '12px', fontWeight: 600,
              backgroundColor: '#f1f5f9', color: '#475569',
            }}>
              {statusLabel}
            </span>
          </div>
          {section.content && (
            <div
              style={{ marginTop: '24px', fontSize: '14px', color: '#334155', lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          )}
        </div>
      );
    }

    // Pricing table: renders the live offer.line_items
    if (section.type === 'pricing_table') {
      return (
        <div key={section.id} style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '17px', fontWeight: 700, color: '#1e293b',
            borderBottom: '2px solid #1e293b', paddingBottom: '6px', marginBottom: '16px',
          }}>
            {title}
          </h2>
          <PricingTable />
          {section.content && (
            <div
              style={{ marginTop: '16px', fontSize: '13px', color: '#475569', lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          )}
        </div>
      );
    }

    // Payment schedule: totals block + optional note
    if (section.type === 'payment_schedule') {
      return (
        <div key={section.id} style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '17px', fontWeight: 700, color: '#1e293b',
            borderBottom: '2px solid #1e293b', paddingBottom: '6px', marginBottom: '16px',
          }}>
            {title}
          </h2>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px',
          }}>
            {[
              { label: isAr ? 'المجموع الفرعي' : 'Subtotal',    value: offer.subtotal       },
              { label: isAr ? 'ضريبة القيمة المضافة' : 'VAT',   value: offer.vat_amount     },
              { label: isAr ? 'الإجمالي الكلي' : 'Total',       value: offer.total_value    },
            ].map(({ label, value }) => (
              <div key={label} style={{
                padding: '12px 16px', backgroundColor: '#f8fafc',
                borderRadius: '8px', border: '1px solid #e2e8f0',
              }}>
                <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{label}</p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  {formatCurrency(value, offer.currency)}
                </p>
              </div>
            ))}
          </div>
          {section.content && (
            <div
              style={{ fontSize: '13px', color: '#334155', lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          )}
        </div>
      );
    }

    // Signature block
    if (section.type === 'signature_block') {
      return (
        <div key={section.id} style={{ marginBottom: '32px' }}>
          {title && (
            <h2 style={{
              fontSize: '17px', fontWeight: 700, color: '#1e293b',
              borderBottom: '2px solid #1e293b', paddingBottom: '6px', marginBottom: '16px',
            }}>
              {title}
            </h2>
          )}
          <SignatureBlock />
        </div>
      );
    }

    // Generic section
    return (
      <div key={section.id} style={{ marginBottom: '32px' }}>
        {title && (
          <h2 style={{
            fontSize: '17px', fontWeight: 700, color: '#1e293b',
            borderBottom: idx === 0 && !hasCover ? '2px solid #1e293b' : '1px solid #cbd5e1',
            paddingBottom: '6px', marginBottom: '14px',
          }}>
            {title}
          </h2>
        )}
        {section.content ? (
          <div
            style={{ fontSize: '14px', color: '#1e293b', lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        ) : (
          <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>
            {isAr ? '(فارغ)' : '(empty)'}
          </p>
        )}
      </div>
    );
  };

  // ── Document header (when no cover_page section exists) ──────────────────
  const DocumentHeader = () => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      marginBottom: '32px', paddingBottom: '20px', borderBottom: '2px solid #1e293b',
    }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
          {isAr ? offer.title_ar : offer.title_en}
        </h1>
        {offer.client_name && (
          <p style={{ fontSize: '13px', color: '#475569' }}>
            {isAr ? 'العميل' : 'Client'}: {offer.client_name}
          </p>
        )}
      </div>
      <div style={{ textAlign: isAr ? 'left' : 'right', fontSize: '12px', color: '#64748b' }}>
        <p style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
          {offer.offer_number}
        </p>
        {offer.expiry_date && (
          <p>{isAr ? 'صالح حتى' : 'Valid until'}: {offer.expiry_date}</p>
        )}
        <span style={{
          display: 'inline-block', marginTop: '4px',
          padding: '2px 10px', borderRadius: '999px',
          backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: '11px',
        }}>
          {statusLabel}
        </span>
      </div>
    </div>
  );

  // ── The printable document ────────────────────────────────────────────────
  const document_el = (
    <div
      id={PREVIEW_ID}
      dir={dir}
      style={{
        fontFamily: isAr
          ? "'Tajawal', 'Noto Kufi Arabic', Arial, sans-serif"
          : "'Inter', 'Segoe UI', system-ui, sans-serif",
        backgroundColor: '#ffffff',
        color: '#1e293b',
        padding: '48px 56px',
        maxWidth: '900px',
        margin: '0 auto',
        lineHeight: 1.6,
      }}
    >
      {!hasCover && <DocumentHeader />}
      {sections.map((s, i) => renderSection(s, i))}
      {sections.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
          <p style={{ fontSize: '15px' }}>
            {isAr ? 'لا توجد أقسام مرئية في هذا العرض.' : 'No visible sections in this offer.'}
          </p>
        </div>
      )}
      {/* Footer */}
      <div style={{
        marginTop: '48px', paddingTop: '16px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between',
        fontSize: '11px', color: '#94a3b8',
      }}>
        <span>{offer.offer_number}</span>
        <span>
          {isAr ? 'عرض سعر رسمي' : 'Commercial Offer'}
          {offer.expiry_date && ` · ${isAr ? 'صالح حتى' : 'Valid until'} ${offer.expiry_date}`}
        </span>
      </div>
    </div>
  );

  // ── Download mode: hidden off-screen ──────────────────────────────────────
  if (mode === 'download') {
    return createPortal(
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: 0, left: '-9999px',
          width: '960px', overflow: 'visible',
          pointerEvents: 'none', zIndex: -1, background: '#fff',
        }}
      >
        {document_el}
      </div>,
      window.document.body,
    );
  }

  // ── Preview mode: full-screen modal ───────────────────────────────────────
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 no-print">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-800 text-sm">{offer.offer_number}</span>
          <span className="text-slate-400 text-sm">—</span>
          <span className="text-slate-600 text-sm">
            {isAr ? offer.title_ar : offer.title_en}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <FileDown size={16} />
            Download PDF
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Printer size={16} />
            Print
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      {/* Scrollable preview area */}
      <div className="flex-1 overflow-auto bg-slate-100 p-8">
        <div className="shadow-xl rounded-sm overflow-hidden">
          {document_el}
        </div>
      </div>
    </div>,
    window.document.body,
  );
}
