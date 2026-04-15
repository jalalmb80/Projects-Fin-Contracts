import React, { useState, useEffect } from 'react';
import { Counterparty, CounterpartyType, Currency } from '../types';
import { useLang, t, tEnum } from '../context/LanguageContext';
import { X } from 'lucide-react';

interface CounterpartyFormProps {
  initialData?: Counterparty;
  onSave: (data: Omit<Counterparty, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
}

export default function CounterpartyForm({ initialData, onSave, onCancel }: CounterpartyFormProps) {
  const { lang } = useLang();
  const isRTL = lang === 'ar';
  const [formData, setFormData] = useState<Omit<Counterparty, 'id' | 'createdAt'>>({
    name: '', type: CounterpartyType.CUSTOMER, taxId: '', email: '', phone: '',
    address: '', contactPerson: '', paymentTermsDays: 30, currency: Currency.SAR, notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) { const { id, createdAt, ...rest } = initialData; setFormData(rest); }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await onSave(formData); }
    catch (error) { console.error('Error saving counterparty:', error); }
    finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'paymentTermsDays' ? parseInt(value) || 0 : value }));
  };

  const inp = 'block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const lbl = 'block text-sm font-medium text-gray-700 mb-1';
  const btnSec = 'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none disabled:opacity-50';
  const btnPri = 'inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none disabled:opacity-50';

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {initialData ? t('تعديل الطرف', 'Edit Counterparty', lang) : t('طرف جديد', 'New Counterparty', lang)}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-500"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={lbl}>{t('الاسم *', 'Name *', lang)}</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className={inp} />
            </div>
            <div>
              <label className={lbl}>{t('النوع *', 'Type *', lang)}</label>
              <select name="type" required value={formData.type} onChange={handleChange} className={inp}>
                {Object.values(CounterpartyType).map(type => <option key={type} value={type}>{tEnum(type, lang)}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>{t('العملة *', 'Currency *', lang)}</label>
              <select name="currency" required value={formData.currency} onChange={handleChange} className={inp}>
                {Object.values(Currency).map(curr => <option key={curr} value={curr}>{tEnum(curr, lang)}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>{t('الرقم الضريبي', 'Tax ID', lang)}</label>
              <input type="text" name="taxId" value={formData.taxId || ''} onChange={handleChange} className={inp} />
            </div>
            <div>
              <label className={lbl}>{t('أيام شروط الدفع', 'Payment Terms (Days)', lang)}</label>
              <input type="number" name="paymentTermsDays" min="0" value={formData.paymentTermsDays} onChange={handleChange} className={inp} />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>{t('العنوان', 'Address', lang)}</label>
              <textarea name="address" rows={3} value={formData.address || ''} onChange={handleChange} className={inp} />
            </div>
            <div>
              <label className={lbl}>{t('جهة الاتصال', 'Contact Person', lang)}</label>
              <input type="text" name="contactPerson" value={formData.contactPerson || ''} onChange={handleChange} className={inp} />
            </div>
            <div>
              <label className={lbl}>{t('البريد الإلكتروني', 'Email', lang)}</label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className={inp} />
            </div>
            <div>
              <label className={lbl}>{t('الهاتف', 'Phone', lang)}</label>
              <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className={inp} />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>{t('ملاحظات', 'Notes', lang)}</label>
              <textarea name="notes" rows={2} value={formData.notes || ''} onChange={handleChange} className={inp} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onCancel} className={btnSec}>{t('إلغاء', 'Cancel', lang)}</button>
            <button type="submit" disabled={loading} className={btnPri}>
              {loading ? t('جارٍ الحفظ...', 'Saving...', lang) : t('حفظ', 'Save', lang)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
