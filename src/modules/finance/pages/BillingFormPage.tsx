import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  BillingDocument, DocumentType, DocumentDirection, DocumentStatus,
  Currency, TaxProfile, BillingLineItem
} from '../types';
import { ChevronLeft, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { platformBus, PLATFORM_EVENTS } from '../../../core/events/platformBus';
import { useLang, t, tEnum } from '../context/LanguageContext';

export default function BillingFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addBillingDocument, counterparties, projects, legalEntities, settings, loading } = useApp();
  const { lang } = useLang();
  const isRTL = lang === 'ar';

  const initialType = searchParams.get('type') as any || 'AR';

  const [formData, setFormData] = useState<Omit<BillingDocument, 'id' | 'createdAt' | 'updatedAt'>>({
    documentNumber: '',
    type: initialType === 'CreditNote' ? DocumentType.CreditNote : DocumentType.Invoice,
    direction: initialType === 'AP' ? DocumentDirection.AP : initialType === 'IC' ? DocumentDirection.IC : DocumentDirection.AR,
    status: DocumentStatus.Draft,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    counterpartyId: '', counterpartyName: '',
    currency: Currency.SAR, exchangeRate: 1,
    lines: [], subtotal: 0, taxTotal: 0, total: 0, balance: 0, paidAmount: 0,
    taxProfile: TaxProfile.Standard, notes: ''
  });

  useEffect(() => {
    const off = platformBus.on(PLATFORM_EVENTS.CONTRACT_SIGNED, (payload) => {
      setFormData(prev => ({
        ...prev,
        counterpartyId: payload.counterpartyId || '',
        projectId: payload.projectId || '',
        notes: `${t('تم الإنشاء تلقائياً من العقد:', 'Auto-generated from contract:', lang)} ${payload.contractTitle || payload.contractId}`,
        lines: [{ id: crypto.randomUUID(), description: payload.contractTitle || `Contract ${payload.contractId}`, quantity: 1, unitPrice: payload.amount || 0, taxCode: TaxProfile.Standard, taxAmount: (payload.amount || 0) * 0.15, subtotal: payload.amount || 0, total: (payload.amount || 0) * 1.15 }],
      }));
    });
    return off;
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCounterparties = counterparties.filter(c => {
    if (formData.direction === DocumentDirection.AR) return c.type === 'CUSTOMER' || c.type === 'BOTH';
    if (formData.direction === DocumentDirection.AP) return c.type === 'VENDOR' || c.type === 'BOTH';
    if (formData.direction === DocumentDirection.IC) return c.type === 'INTERCOMPANY';
    return true;
  });

  const calculateTotals = (lines: BillingLineItem[]) => ({
    subtotal: lines.reduce((s, l) => s + l.subtotal, 0),
    taxTotal: lines.reduce((s, l) => s + l.taxAmount, 0),
    total: lines.reduce((s, l) => s + l.subtotal + l.taxAmount, 0),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const d = { ...prev, [name]: value };
      if (name === 'counterpartyId') {
        const cp = counterparties.find(c => c.id === value);
        if (cp) { d.counterpartyName = cp.name; d.currency = cp.currency; const dt = new Date(d.date); dt.setDate(dt.getDate() + cp.paymentTermsDays); d.dueDate = dt.toISOString().split('T')[0]; }
      }
      if (name === 'direction' && value === DocumentDirection.IC) { d.taxProfile = TaxProfile.Intercompany; d.counterpartyId = ''; d.counterpartyName = ''; d.fromEntityId = ''; d.toEntityId = ''; }
      if (name === 'fromEntityId' || name === 'toEntityId') {
        const fromId = name === 'fromEntityId' ? value : d.fromEntityId;
        const toId = name === 'toEntityId' ? value : d.toEntityId;
        if (fromId && toId) {
          const from = legalEntities.find(e => e.id === fromId);
          const to = legalEntities.find(e => e.id === toId);
          if (from && to) { d.counterpartyName = `${from.name} → ${to.name}`; d.counterpartyId = toId; d.currency = from.currency; }
        }
      }
      return d;
    });
  };

  const addLine = () => setFormData(prev => ({ ...prev, lines: [...prev.lines, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, taxCode: TaxProfile.Standard, taxAmount: 0, subtotal: 0, total: 0 }] }));

  const updateLine = (id: string, field: keyof BillingLineItem, value: any) => {
    setFormData(prev => {
      const lines = prev.lines.map(line => {
        if (line.id !== id) return line;
        const u = { ...line, [field]: value };
        if (field === 'quantity' || field === 'unitPrice' || field === 'taxCode') {
          u.subtotal = u.quantity * u.unitPrice;
          u.taxAmount = u.subtotal * (u.taxCode === TaxProfile.Standard ? 0.15 : 0);
          u.total = u.subtotal + u.taxAmount;
        }
        return u;
      });
      const totals = calculateTotals(lines);
      return { ...prev, lines, ...totals, balance: totals.total - prev.paidAmount };
    });
  };

  const removeLine = (id: string) => {
    setFormData(prev => {
      const lines = prev.lines.filter(l => l.id !== id);
      const totals = calculateTotals(lines);
      return { ...prev, lines, ...totals, balance: totals.total - prev.paidAmount };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try { await addBillingDocument(formData); navigate('/finance/billing'); }
    catch (error) { console.error('Error creating document:', error); }
    finally { setIsSubmitting(false); }
  };

  if (loading.counterparties || loading.projects) return <div>{t('جارٍ التحميل...', 'Loading...', lang)}</div>;

  const inp = 'block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const lbl = 'block text-sm font-medium text-gray-700 mb-1';
  const btnPri = 'inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none disabled:opacity-50';
  const btnSec = 'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none disabled:opacity-50';

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/finance/billing')} className="text-gray-400 hover:text-gray-500">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{t('مستند فوترة جديد', 'New Billing Document', lang)}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg overflow-hidden p-6 space-y-8">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
          <div>
            <label className={lbl}>{t('الاتجاه', 'Direction', lang)}</label>
            <select name="direction" value={formData.direction} onChange={handleChange} className={inp}>
              {Object.values(DocumentDirection).map(d => <option key={d} value={d}>{tEnum(d, lang)}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>{t('النوع', 'Type', lang)}</label>
            <select name="type" value={formData.type} onChange={handleChange} className={inp}>
              {Object.values(DocumentType).map(tp => <option key={tp} value={tp}>{tEnum(tp, lang)}</option>)}
            </select>
          </div>

          {formData.direction === DocumentDirection.IC ? (
            <>
              <div className="sm:col-span-3">
                <div className="rounded-md bg-blue-50 p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700">{t('فواتير بين الكيانات تستخدم ضريبة 0% تلقائياً.', 'Inter-company invoices use 0% tax automatically.', lang)}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className={lbl}>{t('من الكيان', 'From Entity', lang)}</label>
                <select name="fromEntityId" required value={formData.fromEntityId || ''} onChange={handleChange} className={inp}>
                  <option value="">{t('اختر الكيان', 'Select Entity', lang)}</option>
                  {legalEntities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>{t('إلى الكيان', 'To Entity', lang)}</label>
                <select name="toEntityId" required value={formData.toEntityId || ''} onChange={handleChange} className={inp}>
                  <option value="">{t('اختر الكيان', 'Select Entity', lang)}</option>
                  {legalEntities.filter(e => e.id !== formData.fromEntityId).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className={lbl}>{t('الطرف *', 'Counterparty *', lang)}</label>
              <select name="counterpartyId" required value={formData.counterpartyId} onChange={handleChange} className={inp}>
                <option value="">{t('اختر الطرف', 'Select Counterparty', lang)}</option>
                {filteredCounterparties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className={lbl}>{t('التاريخ', 'Date', lang)}</label>
            <input type="date" name="date" required value={formData.date} onChange={handleChange} className={inp} />
          </div>
          <div>
            <label className={lbl}>{t('تاريخ الاستحقاق', 'Due Date', lang)}</label>
            <input type="date" name="dueDate" required value={formData.dueDate} onChange={handleChange} className={inp} />
          </div>
          <div>
            <label className={lbl}>{t('المشروع (اختياري)', 'Project (Optional)', lang)}</label>
            <select name="projectId" value={formData.projectId || ''} onChange={handleChange} className={inp}>
              <option value="">{t('لا يوجد', 'None', lang)}</option>
              {projects.filter(p => !formData.counterpartyId || p.clientId === formData.counterpartyId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>{t('العملة', 'Currency', lang)}</label>
            <select name="currency" value={formData.currency} onChange={handleChange} className={inp}>
              {Object.values(Currency).map(c => <option key={c} value={c}>{tEnum(c, lang)}</option>)}
            </select>
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">{t('بنود الفاتورة', 'Line Items', lang)}</h3>
            <button type="button" onClick={addLine} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
              <Plus className="h-4 w-4 ml-1" />{t('إضافة بند', 'Add Line', lang)}
            </button>
          </div>

          {formData.lines.length === 0 ? (
            <p className="text-gray-500 text-sm italic py-4 text-center bg-gray-50 rounded-md">
              {t('لا توجد بنود. اضغط "إضافة بند" للبدء.', 'No line items added yet. Click "Add Line" to start.', lang)}
            </p>
          ) : (
            <div className="space-y-3">
              {formData.lines.map(line => (
                <div key={line.id} className="flex items-start gap-3 bg-gray-50 p-3 rounded-md border border-gray-200">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5"><label className="block text-xs text-gray-500 mb-1">{t('الوصف', 'Description', lang)}</label><input type="text" required value={line.description} onChange={e => updateLine(line.id, 'description', e.target.value)} className={inp} /></div>
                    <div className="sm:col-span-2"><label className="block text-xs text-gray-500 mb-1">{t('الكمية', 'Qty', lang)}</label><input type="number" min="1" required value={line.quantity} onChange={e => updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)} className={inp} /></div>
                    <div className="sm:col-span-2"><label className="block text-xs text-gray-500 mb-1">{t('سعر الوحدة', 'Unit Price', lang)}</label><input type="number" min="0" step="0.01" required value={line.unitPrice} onChange={e => updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)} className={inp} /></div>
                    <div className="sm:col-span-3"><label className="block text-xs text-gray-500 mb-1">{t('رمز الضريبة', 'Tax Code', lang)}</label>
                      <select value={line.taxCode} onChange={e => updateLine(line.id, 'taxCode', e.target.value)} className={inp}>
                        {Object.values(TaxProfile).map(tp => <option key={tp} value={tp}>{tEnum(tp, lang)}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeLine(line.id)} className="mt-6 text-red-400 hover:text-red-600 p-1"><Trash2 size={18} /></button>
                </div>
              ))}
              <div className="flex flex-col items-end pt-4 space-y-1 pr-12">
                <div className="flex justify-between w-48 text-sm text-gray-600">
                  <span>{t('الإجمالي الجزئي:', 'Subtotal:', lang)}</span>
                  <span>{new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency: formData.currency }).format(formData.subtotal)}</span>
                </div>
                <div className="flex justify-between w-48 text-sm text-gray-600">
                  <span>{t('الضريبة:', 'Tax:', lang)}</span>
                  <span>{new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency: formData.currency }).format(formData.taxTotal)}</span>
                </div>
                <div className="flex justify-between w-48 text-base font-bold text-gray-900 border-t border-gray-300 pt-1">
                  <span>{t('الإجمالي:', 'Total:', lang)}</span>
                  <span>{new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency: formData.currency }).format(formData.total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className={lbl}>{t('ملاحظات', 'Notes', lang)}</label>
          <textarea name="notes" rows={3} value={formData.notes || ''} onChange={handleChange} className={inp} />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/finance/billing')} className={btnSec}>{t('إلغاء', 'Cancel', lang)}</button>
          <button type="submit" disabled={isSubmitting} className={btnPri}>
            <Save className="h-5 w-5 ml-2" />
            {isSubmitting ? t('جارٍ الحفظ...', 'Saving...', lang) : t('حفظ كمسودة', 'Save as Draft', lang)}
          </button>
        </div>
      </form>
    </div>
  );
}
