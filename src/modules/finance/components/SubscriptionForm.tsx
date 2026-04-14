import React, { useState, useEffect } from 'react';
import {
  Subscription,
  SubscriptionStatus,
  SubscriptionDirection,
  BillingCycle,
  InvoiceTiming,
  Currency,
  SubscriptionItem,
  TaxProfile
} from '../types';
import { X, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLang, t } from '../context/LanguageContext';

interface SubscriptionFormProps {
  initialData?: Subscription;
  onSave: (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export default function SubscriptionForm({ initialData, onSave, onCancel }: SubscriptionFormProps) {
  const { counterparties, legalEntities } = useApp();
  const { lang } = useLang();
  const [formData, setFormData] = useState<Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    legalEntityId: '',
    direction: SubscriptionDirection.AR,
    counterpartyId: '',
    status: SubscriptionStatus.Draft,
    currency: Currency.USD,
    startDate: new Date().toISOString().split('T')[0],
    billingCycle: BillingCycle.Monthly,
    invoiceTiming: InvoiceTiming.InAdvance,
    paymentTermsDays: 30,
    autoRenew: true,
    nextInvoiceDate: new Date().toISOString().split('T')[0],
    items: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialData && counterparties.length > 0 && !formData.counterpartyId) {
      setFormData(prev => ({ ...prev, counterpartyId: counterparties[0].id }));
    }
    if (!initialData && legalEntities.length > 0 && !formData.legalEntityId) {
      setFormData(prev => ({ ...prev, legalEntityId: legalEntities[0].id }));
    }
    if (initialData) {
      const { id, createdAt, updatedAt, ...rest } = initialData;
      setFormData(rest);
    }
  }, [initialData, counterparties, legalEntities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : name === 'paymentTermsDays'
          ? parseInt(value) || 0
          : value
    }));
  };

  const addItem = () => {
    const newItem: SubscriptionItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxCode: TaxProfile.Standard
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const updateItem = (id: string, field: keyof SubscriptionItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
  };

  const calculateTotal = () =>
    formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {initialData ? t('تعديل الاشتراك', 'Edit Subscription', lang) : t('اشتراك جديد', 'New Subscription', lang)}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-500">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="form-label">{t('اسم الاشتراك *', 'Subscription Name *', lang)}</label>
              <input type="text" name="name" id="name" required value={formData.name} onChange={handleChange} className="form-input" />
            </div>

            <div>
              <label htmlFor="legalEntityId" className="form-label">{t('الكيان القانوني *', 'Legal Entity *', lang)}</label>
              <select name="legalEntityId" id="legalEntityId" required value={formData.legalEntityId} onChange={handleChange} className="form-input">
                <option value="">{t('اختر الكيان', 'Select Legal Entity', lang)}</option>
                {legalEntities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="counterpartyId" className="form-label">{t('الطرف الآخر *', 'Counterparty *', lang)}</label>
              <select name="counterpartyId" id="counterpartyId" required value={formData.counterpartyId} onChange={handleChange} className="form-input">
                <option value="">{t('اختر الطرف', 'Select Counterparty', lang)}</option>
                {counterparties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="form-label">{t('الحالة', 'Status', lang)}</label>
              <select name="status" id="status" value={formData.status} onChange={handleChange} className="form-input">
                {Object.values(SubscriptionStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="direction" className="form-label">{t('الاتجاه', 'Direction', lang)}</label>
              <select name="direction" id="direction" value={formData.direction} onChange={handleChange} className="form-input">
                {Object.values(SubscriptionDirection).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="currency" className="form-label">{t('العملة', 'Currency', lang)}</label>
              <select name="currency" id="currency" value={formData.currency} onChange={handleChange} className="form-input">
                {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="billingCycle" className="form-label">{t('دورة الفوترة', 'Billing Cycle', lang)}</label>
              <select name="billingCycle" id="billingCycle" value={formData.billingCycle} onChange={handleChange} className="form-input">
                {Object.values(BillingCycle).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="invoiceTiming" className="form-label">{t('توقيت الفاتورة', 'Invoice Timing', lang)}</label>
              <select name="invoiceTiming" id="invoiceTiming" value={formData.invoiceTiming} onChange={handleChange} className="form-input">
                {Object.values(InvoiceTiming).map(it => <option key={it} value={it}>{it}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="startDate" className="form-label">{t('تاريخ البداية', 'Start Date', lang)}</label>
              <input type="date" name="startDate" id="startDate" value={formData.startDate} onChange={handleChange} className="form-input" />
            </div>

            <div>
              <label htmlFor="nextInvoiceDate" className="form-label">{t('تاريخ الفاتورة القادمة', 'Next Invoice Date', lang)}</label>
              <input type="date" name="nextInvoiceDate" id="nextInvoiceDate" value={formData.nextInvoiceDate} onChange={handleChange} className="form-input" />
            </div>

            <div className="flex items-center mt-6">
              <input
                id="autoRenew"
                name="autoRenew"
                type="checkbox"
                checked={formData.autoRenew}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="autoRenew" className="ml-2 block text-sm text-gray-900">
                {t('تجديد تلقائي', 'Auto Renew', lang)}
              </label>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">{t('بنود الاشتراك', 'Subscription Items', lang)}</h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                <Plus className="-ml-0.5 mr-2 h-4 w-4" />
                {t('إضافة بند', 'Add Item', lang)}
              </button>
            </div>

            {formData.items.length === 0 ? (
              <p className="text-gray-500 text-sm italic">{t('لا توجد بنود حتى الآن.', 'No items added yet.', lang)}</p>
            ) : (
              <div className="space-y-3">
                {formData.items.map((item) => (
                  <div key={item.id} className="flex items-start space-x-3 bg-gray-50 p-3 rounded-md">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-5">
                        <label className="block text-xs text-gray-500 mb-1">{t('الوصف', 'Description', lang)}</label>
                        <input type="text" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} className="form-input" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">{t('الكمية', 'Quantity', lang)}</label>
                        <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="form-input" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">{t('سعر الوحدة', 'Unit Price', lang)}</label>
                        <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="form-input" />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-xs text-gray-500 mb-1">{t('رمز الضريبة', 'Tax Code', lang)}</label>
                        <select value={item.taxCode} onChange={(e) => updateItem(item.id, 'taxCode', e.target.value)} className="form-input">
                          {Object.values(TaxProfile).map(tp => <option key={tp} value={tp}>{tp}</option>)}
                        </select>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeItem(item.id)} className="mt-6 text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <p className="text-sm font-medium text-gray-700">
                    {t('الإجمالي', 'Total', lang)}: {formData.currency} {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('إلغاء', 'Cancel', lang)}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? t('جارٍ الحفظ...', 'Saving...', lang) : t('حفظ الاشتراك', 'Save Subscription', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
