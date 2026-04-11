import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLang, t } from '../context/LanguageContext';
import { Plus, Search, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';
import { Payment, PaymentDirection, PaymentMethod } from '../types';

export default function PaymentsPage() {
  const { payments, counterparties, loading } = useApp();
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState<'IN' | 'OUT'>('IN');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPayments = payments.filter(p => {
    if (activeTab === 'IN' && p.direction !== PaymentDirection.IN) return false;
    if (activeTab === 'OUT' && p.direction !== PaymentDirection.OUT) return false;
    const counterpartyName = counterparties.find(c => c.id === p.counterpartyId)?.name || '';
    return (p.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      counterpartyName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);

  const methodLabel = (method: PaymentMethod) => {
    const map: Record<string, [string, string]> = {
      BankTransfer: ['\u062a\u062d\u0648\u064a\u0644 \u0628\u0646\u0643\u064a', 'Bank Transfer'],
      Cash: ['\u0646\u0642\u062f\u0627\u064b', 'Cash'],
      Check: ['\u0634\u064a\u0643', 'Check'],
      CreditCard: ['\u0628\u0637\u0627\u0642\u0629 \u0627\u0626\u062a\u0645\u0627\u0646', 'Credit Card'],
      Other: ['\u0623\u062e\u0631\u0649', 'Other'],
    };
    return t(map[method]?.[0] ?? method, map[method]?.[1] ?? method, lang);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('\u0627\u0644\u0645\u062f\u0641\u0648\u0639\u0627\u062a', 'Payments', lang)}</h1>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
          <Plus className={`-ml-1 ${lang==='ar'?'ml-2':'mr-2'} h-5 w-5`}/>
          {t('\u062f\u0641\u0639\u0629 \u062c\u062f\u064a\u062f\u0629', 'New Payment', lang)}
        </button>
      </div>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {([['IN', '\u0645\u064f\u0633\u062a\u0644\u0645\u0629 (\u0648\u0627\u0631\u062f)', 'Received (IN)', ArrowDownRight, 'text-green-500'] as const,
               ['OUT', '\u0645\u064f\u0631\u0633\u0644\u0629 (\u0635\u0627\u062f\u0631)', 'Sent (OUT)', ArrowUpRight, 'text-red-500'] as const]).map(([id, ar, en, Icon, activeColor]) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center
                  ${activeTab===id?'border-indigo-500 text-indigo-600':'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                <Icon className={`${lang==='ar'?'ml-2':'mr-2'} h-5 w-5 ${activeTab===id?activeColor:'text-gray-400'}`}/>
                {t(ar, en, lang)}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="relative rounded-md shadow-sm max-w-md">
            <div className={`absolute inset-y-0 ${lang==='ar'?'right-0 pr-3':'left-0 pl-3'} flex items-center pointer-events-none`}>
              <Search className="h-5 w-5 text-gray-400"/>
            </div>
            <input type="text" className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full ${lang==='ar'?'pr-10 text-right':'pl-10'} sm:text-sm border-gray-300 rounded-md`}
              placeholder={t('\u0628\u062d\u062b \u0628\u0631\u0642\u0645 \u0627\u0644\u0645\u0631\u062c\u0639 \u0623\u0648 \u0627\u0644\u0637\u0631\u0641...', 'Search by reference or counterparty...', lang)}
              value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} dir={lang==='ar'?'rtl':'ltr'}/>
          </div>
        </div>
        {loading.payments ? (
          <div className="p-12 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div></div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-gray-500"><h3 className="mt-2 text-sm font-medium text-gray-900">{t('\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u062f\u0641\u0648\u0639\u0627\u062a', 'No payments found', lang)}</h3></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[t('\u0627\u0644\u062a\u0627\u0631\u064a\u062e','Date',lang),t('\u0627\u0644\u0637\u0631\u0641','Counterparty',lang),t('\u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u062f\u0641\u0639','Method',lang),t('\u0627\u0644\u0645\u0631\u062c\u0639','Reference',lang)].map(h=>(
                    <th key={h} className={`px-6 py-3 ${lang==='ar'?'text-right':'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{h}</th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('\u0627\u0644\u0645\u0628\u0644\u063a','Amount',lang)}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('\u063a\u064a\u0631 \u0645\u062e\u0635\u0635','Unallocated',lang)}</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map(payment => {
                  const counterparty = counterparties.find(c=>c.id===payment.counterpartyId);
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(payment.date).toLocaleDateString(lang==='ar'?'ar-SA':'en-US')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{counterparty?.name||t('\u063a\u064a\u0631 \u0645\u0639\u0631\u0648\u0641','Unknown',lang)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{methodLabel(payment.method)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.reference||'-'}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${payment.direction===PaymentDirection.IN?'text-green-600':'text-red-600'}`}>{formatCurrency(payment.amount,payment.currency)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{payment.unallocatedAmount>0?<span className="text-orange-600 font-medium">{formatCurrency(payment.unallocatedAmount,payment.currency)}</span>:'-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="h-5 w-5"/></button></td>
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
