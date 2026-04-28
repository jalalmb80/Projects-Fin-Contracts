/**
 * CreateContractFromOfferModal
 *
 * Opens automatically inside CMSLayout when platformBus fires OFFER_WON.
 * Pre-fills a new CMS contract draft from the won offer’s data.
 *
 * Behaviour:
 *   - Creates a cms_contracts document directly via setDoc (same pattern
 *     as CreateFinanceProjectModal — no useContracts() dependency).
 *   - Sets contract.linked_offer_id = offerId for traceability.
 *   - Contract number is auto-generated as a placeholder and should be
 *     updated by the user after creation.
 *   - Only appears when CMS module is mounted. If the user is on another
 *     module when an offer is won, they can create the contract manually.
 *
 * Language: Arabic (CMS is RTL-first).
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
  const [titleAr,        setTitleAr]        = useState(`\u0639\u0642\u062f \u062e\u062f\u0645\u0627\u062a \u2014 ${clientName}`);
  const [contractType,   setContractType]   = useState(DEFAULT_CONTRACT_TYPES[0]);
  const [startDate,      setStartDate]      = useState(new Date().toISOString().split('T')[0]);
  const [endDate,        setEndDate]        = useState('');
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [done,           setDone]           = useState(false);

  const handleCreate = async () => {
    if (!titleAr.trim()) { setError('\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0639\u0642\u062f'); return; }
    if (!contractNumber.trim()) { setError('\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0631\u0642\u0645 \u0627\u0644\u0639\u0642\u062f'); return; }

    setSaving(true);
    setError(null);

    try {
      const id  = crypto.randomUUID();
      const now = new Date().toISOString();

      const paymentSchedule: PaymentSchedule = {
        subtotal_sar:    subtotal,
        vat_rate:        defaultVAT,
        vat_amount:      vatAmount,
        total_sar:       totalValue,
        bank_iban:       '',
        bank_name:       '',
        account_holder:  '',
        tasks:           [],
        installments:    [],
      };

      const contract: Contract = {
        id,
        contract_number:  contractNumber.trim(),
        title_ar:         titleAr.trim(),
        type:             contractType,
        status:           DEFAULT_CONTRACT_STATUSES[0].label,  // '\u0645\u0633\u0648\u062f\u0629'
        client_id:        clientId,
        start_date:       startDate,
        end_date:         endDate || undefined,
        articles:         [],
        payment_schedule: paymentSchedule,
        appendices:       [],
        attachments:      [],
        versions:         [],
        tags:             ['\u0645\u0646-\u0639\u0631\u0636'],
        workflow_events:  [],
        linked_offer_id:  offerId,
      };

      await setDoc(doc(db, 'cms_contracts', id), contract);
      setDone(true);
    } catch (e: any) {
      console.error('[CreateContractFromOfferModal]', e);
      setError(e?.message ?? '\u062d\u062f\u062b \u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg mx-auto overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-l from-emerald-600 to-teal-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-none">
                \u0625\u0646\u0634\u0627\u0621 \u0639\u0642\u062f \u0645\u0646 \u0639\u0631\u0636 \u0645\u0643\u0633\u0648\u0628
              </h2>
              <p className="text-emerald-100 text-xs mt-0.5">
                \u0639\u0631\u0636 {offerNumber} \u2014 {clientName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {done ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0639\u0642\u062f \u0628\u0646\u062c\u0627\u062d</h3>
            <p className="text-slate-500 text-sm mb-6">
              \u064a\u0645\u0643\u0646\u0643 \u0645\u062a\u0627\u0628\u0639\u062a\u0647 \u0645\u0646 \u0635\u0641\u062d\u0629 \u0627\u0644\u0639\u0642\u0648\u062f \u0648\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0628\u0646\u0648\u062f \u0648\u062c\u062f\u0627\u0648\u0644 \u0627\u0644\u062f\u0641\u0639.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
            >
              \u062a\u0645
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Total value info pill */}
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
              <span className="text-xs text-emerald-700 font-medium">\u0642\u064a\u0645\u0629 \u0627\u0644\u0639\u0631\u0636:</span>
              <span className="text-sm font-bold text-emerald-800">
                {totalValue.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">

              {/* Contract number */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">\u0631\u0642\u0645 \u0627\u0644\u0639\u0642\u062f</label>
                <input
                  type="text" dir="ltr" value={contractNumber}
                  onChange={e => setContractNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* Contract type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">\u0646\u0648\u0639 \u0627\u0644\u0639\u0642\u062f</label>
                <select
                  value={contractType} onChange={e => setContractType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                >
                  {DEFAULT_CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Title */}
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0639\u0642\u062f <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" dir="rtl" value={titleAr}
                  onChange={e => setTitleAr(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* Start date */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0628\u062f\u0621</label>
                <input
                  type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* End date */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0627\u0646\u062a\u0647\u0627\u0621 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)</label>
                <input
                  type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            <p className="text-xs text-slate-400">
              \u0633\u064a\u064f\u0646\u0634\u0623 \u0627\u0644\u0639\u0642\u062f \u0628\u062d\u0627\u0644\u0629 \u201c\u0645\u0633\u0648\u062f\u0629\u201d. \u064a\u0645\u0643\u0646 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0628\u0646\u0648\u062f \u0648\u0627\u0644\u062a\u0639\u062f\u064a\u0644 \u0645\u0646 \u0645\u062d\u0631\u0631 \u0627\u0644\u0639\u0642\u0648\u062f.
              \u0627\u0644\u0639\u0642\u062f \u0645\u0631\u062a\u0628\u0637 \u0628\u0627\u0644\u0639\u0631\u0636 {offerNumber}.
            </p>

            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium"
              >
                \u062a\u062e\u0637\u0651\u064a
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !titleAr.trim()}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
              >
                {saving ? '\u062c\u0627\u0631\u064d \u0627\u0644\u0625\u0646\u0634\u0627\u0621...' : '\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0639\u0642\u062f'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
