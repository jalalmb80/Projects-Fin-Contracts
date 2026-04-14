import React, { useState, useEffect } from 'react';
import { Counterparty, CounterpartyType, Currency } from '../types';
import { useLang, t } from '../context/LanguageContext';
import { X } from 'lucide-react';

interface CounterpartyFormProps {
  initialData?: Counterparty;
  onSave: (data: Omit<Counterparty, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
}

export default function CounterpartyForm({ initialData, onSave, onCancel }: CounterpartyFormProps) {
  const { lang } = useLang();
  const [formData, setFormData] = useState<Omit<Counterparty, 'id' | 'createdAt'>>({
    name: '', type: CounterpartyType.CUSTOMER, taxId: '', email: '', phone: '',
    address: '', contactPerson: '', paymentTermsDays: 30, currency: Currency.USD, notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      const { id, createdAt, ...rest } = initialData;
      setFormData(rest);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await onSave(formData); }
    catch (error) { console.error('Error saving counterparty:', error); }
    finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'paymentTermsDays' ? parseInt(value) || 0 : value }));
  };

  const typeLabel = (type: CounterpartyType) => {
    const labels: Record<CounterpartyType, [string, string]> = {
      [CounterpartyType.CUSTOMER]: ['عميل', 'Customer'],
      [CounterpartyType.VENDOR]: ['مورّد', 'Vendor'],
      [CounterpartyType.BOTH]: ['عميل ومورّد', 'Both'],
      [CounterpartyType.INTERCOMPANY]: ['داخلي', 'Intercompany'],
    };
    return t(labels[type][0], labels[type][1], lang);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {initialData ? t('تعديل الطرف', 'Edit Counterparty', lang) : t('طرف جديد', 'New Counterparty', lang)}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-500"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="form-label">{t('الاسم *', 'Name *', lang)}</label>
              <input type="text" name="name" id="name" required value={formData.name} onChange={handleChange} className="form-input" />
            </div>
            <div>
              <label htmlFor="type" className="form-label">{t('النوع *', 'Type *', lang)}</label>
              <select name="type" id="type" required value={formData.type} onChange={handleChange} className="form-input">
                {Object.values(CounterpartyType).map(type => <option key={type} value={type}>{typeLabel(type)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="currency" className="form-label">{t('العملة *', 'Currency *', lang)}</label>
              <select name="currency" id="currency" required value={formData.currency} onChange={handleChange} className="form-input">
                {Object.values(Currency).map(curr => <option key={curr} value={curr}>{curr}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="taxId" className="form-label">{t('الرقم الضريبي', 'Tax ID', lang)}</label>
              <input type="text" name="taxId" id="taxId" value={formData.taxId || ''} onChange={handleChange} className="form-input" />
            </div>
            <div>
              <label htmlFor="paymentTermsDays" className="form-label">{t('أيام شروط الدفع', 'Payment Terms (Days)', lang)}</label>
              <input type="number" name="paymentTermsDays" id="paymentTermsDays" min="0" value={formData.paymentTermsDays} onChange={handleChange} className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="address" className="form-label">{t('العنوان', 'Address', lang)}</label>
              <textarea name="address" id="address" rows={3} value={formData.address || ''} onChange={handleChange} className="form-input" />
            </div>
            <div>
              <label htmlFor="contactPerson" className="form-label">{t('جهة الاتصال', 'Contact Person', lang)}</label>
              <input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson || ''} onChange={handleChange} className="form-input" />
            </div>
            <div>
              <label htmlFor="email" className="form-label">{t('البريد الإلكتروني', 'Email', lang)}</label>
              <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleChange} className="form-input" />
            </div>
            <div>
              <label htmlFor="phone" className="form-label">{t('الهاتف', 'Phone', lang)}</label>
              <input type="text" name="phone" id="phone" value={formData.phone || ''} onChange={handleChange} className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="form-label">{t('ملاحظات', 'Notes', lang)}</label>
              <textarea name="notes" id="notes" rows={2} value={formData.notes || ''} onChange={handleChange} className="form-input" />
            </div>
          </div>
          <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('إلغاء', 'Cancel', lang)}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? t('جارٍ الحفظ...', 'Saving...', lang) : t('حفظ', 'Save', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
