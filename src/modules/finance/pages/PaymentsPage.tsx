import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLang, t } from '../context/LanguageContext';
import { Plus, Search, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';
import { PaymentDirection, PaymentMethod } from '../types';

export default function PaymentsPage() {
  const { payments, counterparties, loading } = useApp();
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState<'IN' | 'OUT'>('IN');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPayments = payments.filter(p => {
    if (activeTab === 'IN' && p.direction !== PaymentDirection.IN) return false;
    if (activeTab === 'OUT' && p.direction !== PaymentDirection.OUT) return false;
    const name = counterparties.find(c => c.id === p.counterpartyId)?.name || '';
    return (p.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const fmt = (amount: number, currency: string) =>
    new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);

  const methodLabel = (method: PaymentMethod) => {
    const map: Record<string, [string, string]> = {
      BankTransfer: ['تحويل بنكي', 'Bank Transfer'],
      Cash:         ['نقداً', 'Cash'],
      Check:        ['شيك', 'Check'],
      CreditCard:   ['بطاقة ائتمان', 'Credit Card'],
      Other:        ['أخرى', 'Other'],
    };
    return t(map[method]?.[0] ?? method, map[method]?.[1] ?? method, lang);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('المدفوعات', 'Payments', lang)}</h1>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <Plus className={`-ml-1 ${lang === 'ar' ? 'ml-2' : 'mr-2'} h-5 w-5`} />
          {t('دفعة جديدة', 'New Payment', lang)}
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {([
              ['IN',  'مُستلمة (وارد)',   'Received (IN)',  ArrowDownRight, 'text-green-500'],
              ['OUT', 'مُرسلة (صادر)', 'Sent (OUT)',     ArrowUpRight,   'text-red-500'],
            ] as const).map(([id, ar, en, Icon, activeColor]) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center ${
                  activeTab === id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}>
                <Icon className={`${lang === 'ar' ? 'ml-2' : 'mr-2'} h-5 w-5 ${activeTab === id ? activeColor : 'text-gray-400'}`} />
                {t(ar, en, lang)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="relative rounded-md shadow-sm max-w-md">
            <div className={`absolute inset-y-0 ${lang === 'ar' ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text"
              className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full ${lang === 'ar' ? 'pr-10 text-right' : 'pl-10'} sm:text-sm border-gray-300 rounded-md`}
              placeholder={t('بحث برقم المرجع أو الطرف...', 'Search by reference or counterparty...', lang)}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} dir={lang === 'ar' ? 'rtl' : 'ltr'} />
          </div>
        </div>

        {loading.payments ? (
          <div className="p-12 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" /></div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('لا توجد مدفوعات', 'No payments found', lang)}</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>
                {[t('التاريخ','Date',lang), t('الطرف','Counterparty',lang), t('طريقة الدفع','Method',lang), t('المرجع','Reference',lang)].map(h => (
                  <th key={h} className={`px-6 py-3 ${lang === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{h}</th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('المبلغ', 'Amount', lang)}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('غير مخصص', 'Unallocated', lang)}</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map(payment => {
                  const cp = counterparties.find(c => c.id === payment.counterpartyId);
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(payment.date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cp?.name || t('غير معروف', 'Unknown', lang)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{methodLabel(payment.method)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.reference || '-'}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${payment.direction === PaymentDirection.IN ? 'text-green-600' : 'text-red-600'}`}>
                        {fmt(payment.amount, payment.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {payment.unallocatedAmount > 0
                          ? <span className="text-orange-600 font-medium">{fmt(payment.unallocatedAmount, payment.currency)}</span>
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="h-5 w-5" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
