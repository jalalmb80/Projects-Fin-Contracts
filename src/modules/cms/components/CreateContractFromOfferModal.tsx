/**
 * CreateContractFromOfferModal
 *
 * Opens automatically inside CMSLayout when platformBus fires OFFER_WON.
 * Pre-fills a new CMS contract draft from the won offer's data.
 * Sets contract.linked_offer_id = offerId for traceability.
 */
import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { X, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { db } from '../../../core/firebase';
import { Contract, PaymentSchedule, DEFAULT_CONTRACT_STATUSES, DEFAULT_CONTRACT_TYPES } from '../types';

interface OfferWonPayload {
  offerId:     string;
  offerNumber: string;
  clientId:    string;
  clientName:  string;
  totalValue:  number;
}

interface Props {
  payload:  OfferWonPayload;
  onClose:  () => void;
}

export default function CreateContractFromOfferModal({ payload, onClose }: Props) {
  const { offerId, offerNumber, clientId, clientName, totalValue } = payload;

  const year        = new Date().getFullYear();
  const defaultNum  = `CNT-${year}-OFF-${offerNumber}`;
  const defaultVAT  = 15;
  const subtotal    = Math.round((totalValue / (1 + defaultVAT / 100)) * 100) / 100;
  const vatAmount   = Math.round((totalValue - subtotal) * 100) / 100;

  const [contractNumber, setContractNumber] = useState(defaultNum);
  const [titleAr,        setTitleAr]        = useState(`عقد خدمات — ${clientName}`);
  const [contractType,   setContractType]   = useState(DEFAULT_CONTRACT_TYPES[0]);
  const [startDate,      setStartDate]      = useState(new Date().toISOString().split('T')[0]);
  const [endDate,        setEndDate]        = useState('');
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [done,           setDone]           = useState(false);

  const handleCreate = async () => {
    if (!titleAr.trim()) { setError('يرجى إدخال عنوان العقد'); return; }
    if (!contractNumber.trim()) { setError('يرجى إدخال رقم العقد'); return; }
    setSaving(true);
    setError(null);
    try {
      const id  = crypto.randomUUID();
      const paymentSchedule: PaymentSchedule = { subtotal_sar: subtotal, vat_rate: defaultVAT, vat_amount: vatAmount, total_sar: totalValue, bank_iban: '', bank_name: '', account_holder: '', tasks: [], installments: [] };
      const contract: Contract = { id, contract_number: contractNumber.trim(), title_ar: titleAr.trim(), type: contractType, status: DEFAULT_CONTRACT_STATUSES[0].label, client_id: clientId, start_date: startDate, end_date: endDate || undefined, articles: [], payment_schedule: paymentSchedule, appendices: [], attachments: [], versions: [], tags: ['من-عرض'], workflow_events: [], linked_offer_id: offerId };
      await setDoc(doc(db, 'cms_contracts', id), contract);
      setDone(true);
    } catch (e: any) {
      console.error('[CreateContractFromOfferModal]', e);
      setError(e?.message ?? 'حدث خطأ غير متوقع');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg mx-auto overflow-hidden">
        <div className="bg-gradient-to-l from-emerald-600 to-teal-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><FileText size={20} className="text-white" /></div>
            <div>
              <h2 className="text-white font-bold text-lg leading-none">إنشاء عقد من عرض مكسوب</h2>
              <p className="text-emerald-100 text-xs mt-0.5">عرض {offerNumber} — {clientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><X size={18} /></button>
        </div>
        {done ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-emerald-600" /></div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">تم إنشاء العقد بنجاح</h3>
            <p className="text-slate-500 text-sm mb-6">يمكنك متابعته من صفحة العقود وإضافة البنود وجداول الدفع.</p>
            <button onClick={onClose} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium">تم</button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {error && (<div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm"><AlertCircle size={16} className="shrink-0 mt-0.5" /><span>{error}</span></div>)}
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
              <span className="text-xs text-emerald-700 font-medium">قيمة العرض:</span>
              <span className="text-sm font-bold text-emerald-800">{totalValue.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">رقم العقد</label><input type="text" dir="ltr" value={contractNumber} onChange={e => setContractNumber(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">نوع العقد</label><select value={contractType} onChange={e => setContractType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">{DEFAULT_CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div className="col-span-2 space-y-1.5"><label className="text-sm font-medium text-slate-700">عنوان العقد <span className="text-red-500">*</span></label><input type="text" dir="rtl" value={titleAr} onChange={e => setTitleAr(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">تاريخ البدء</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium text-slate-700">تاريخ الانتهاء (اختياري)</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" /></div>
            </div>
            <p className="text-xs text-slate-400">سيُنشأ العقد بحالة “مسودة”. العقد مرتبط بالعرض {offerNumber}.</p>
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium">تخطّي</button>
              <button onClick={handleCreate} disabled={saving || !titleAr.trim()} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">{saving ? 'جارٍ الإنشاء...' : 'إنشاء العقد'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
