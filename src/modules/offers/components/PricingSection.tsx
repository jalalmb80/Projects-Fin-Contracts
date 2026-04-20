import React, { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { LineItem, Offer, OfferCurrency } from '../types';
import { calculateLineTotal, calculateTotals, formatCurrency } from '../utils/pricing';

interface Props {
  offer: Offer;
  readOnly: boolean;
  onSave: (items: LineItem[], discountPct: number, vatRate: number) => Promise<void>;
}

function emptyItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    quantity: 1,
    unit: 'unit',
    unit_price: 0,
    discount_pct: 0,
    line_total: 0,
    is_mandatory: false,
    is_included: true,
  };
}

export default function PricingSection({ offer, readOnly, onSave }: Props) {
  const [items,       setItems]       = useState<LineItem[]>(() => offer.line_items ?? []);
  const [discount,   setDiscount]     = useState(offer.global_discount_pct ?? 0);
  const [vat,        setVat]          = useState(offer.vat_rate ?? 15);
  const [saving,     setSaving]       = useState(false);
  const [saved,      setSaved]        = useState(false);

  const totals = calculateTotals(items, discount, vat);

  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, ...patch };
      updated.line_total = calculateLineTotal(updated);
      return updated;
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(items, discount, vat);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const currency = offer.currency ?? 'SAR';

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Pricing Table</h2>
        {!readOnly && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 disabled:opacity-60 transition-colors"
          >
            <Save size={12} />
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
          </button>
        )}
      </div>

      {/* Line items table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-500">Item</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-500">Qty</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-500">Unit Price</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-500">Disc %</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-500">Total</th>
              {!readOnly && <th className="w-8" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <input
                    value={item.name}
                    disabled={readOnly}
                    onChange={e => updateItem(item.id, { name: e.target.value })}
                    className="w-full text-sm text-slate-800 bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-violet-200 rounded px-1"
                    placeholder="Item name"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number" min="0" value={item.quantity}
                    disabled={readOnly}
                    onChange={e => updateItem(item.id, { quantity: +e.target.value })}
                    className="w-16 text-right text-sm bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-violet-200 rounded px-1"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number" min="0" step="0.01" value={item.unit_price}
                    disabled={readOnly}
                    onChange={e => updateItem(item.id, { unit_price: +e.target.value })}
                    className="w-24 text-right text-sm bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-violet-200 rounded px-1"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number" min="0" max="100" value={item.discount_pct}
                    disabled={readOnly}
                    onChange={e => updateItem(item.id, { discount_pct: +e.target.value })}
                    className="w-14 text-right text-sm bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-violet-200 rounded px-1"
                  />
                </td>
                <td className="px-3 py-2 text-right text-sm font-medium text-slate-800">
                  {formatCurrency(item.line_total, currency)}
                </td>
                {!readOnly && (
                  <td className="px-2 py-2">
                    <button
                      onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
                      className="p-1 rounded hover:bg-red-50 hover:text-red-500 text-slate-400 transition-colors"
                      aria-label="Remove line item"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <button
          onClick={() => setItems(prev => [...prev, emptyItem()])}
          className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 transition-colors"
        >
          <Plus size={13} /> Add line item
        </button>
      )}

      {/* Totals */}
      <div className="ml-auto w-72 space-y-1.5 text-sm border-t border-slate-200 pt-4">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span>{formatCurrency(totals.subtotal, currency)}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <label className="flex items-center gap-1.5">
            Global discount
            {!readOnly && (
              <input
                type="number" min="0" max="100" value={discount}
                onChange={e => setDiscount(+e.target.value)}
                className="w-12 text-right border border-slate-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-200"
              />
            )}
            {readOnly && <span>({discount}%)</span>}
          </label>
          <span className="text-red-600">-{formatCurrency(totals.discount_amount, currency)}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <label className="flex items-center gap-1.5">
            VAT
            {!readOnly && (
              <input
                type="number" min="0" max="100" value={vat}
                onChange={e => setVat(+e.target.value)}
                className="w-12 text-right border border-slate-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-200"
              />
            )}
            {readOnly && <span>({vat}%)</span>}
          </label>
          <span>{formatCurrency(totals.vat_amount, currency)}</span>
        </div>
        <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-200 pt-2">
          <span>Total</span>
          <span>{formatCurrency(totals.total_value, currency)}</span>
        </div>
      </div>
    </div>
  );
}
