import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Play } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLang, t } from '../context/LanguageContext';
import { useToast } from '../components/ui/Toast';
import { Subscription, SubscriptionStatus } from '../types';
import SubscriptionForm from '../components/SubscriptionForm';

export default function SubscriptionListPage() {
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription, counterparties, loading, runBillingJob } = useApp();
  const { lang } = useLang();
  const { addToast } = useToast();
  const [isBillingRunning, setIsBillingRunning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const counterpartyNames = Object.fromEntries(counterparties.map(c => [c.id, c.name]));

  const handleSave = async (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingId) await updateSubscription(editingId, data);
      else await addSubscription(data);
      setIsModalOpen(false); setEditingId(null);
    } catch (err) { console.error('Error saving subscription:', err); }
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return; }
    setConfirmDeleteId(null);
    try {
      await deleteSubscription(id);
      addToast('success', t('تم حذف الاشتراك', 'Subscription deleted', lang));
    } catch { addToast('error', t('فشل الحذف', 'Failed to delete', lang)); }
  };

  const handleRunBillingJob = async () => {
    setIsBillingRunning(true);
    try { await runBillingJob(); }
    catch (err) { console.error(err); addToast('error', t('فشلت عملية الفوترة', 'Billing Job Failed', lang)); }
    finally { setIsBillingRunning(false); }
  };

  const filteredSubscriptions = subscriptions.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (counterpartyNames[s.counterpartyId] || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: SubscriptionStatus) => {
    switch (status) {
      case SubscriptionStatus.Active:    return 'bg-green-100  text-green-800';
      case SubscriptionStatus.Draft:     return 'bg-gray-100   text-gray-800';
      case SubscriptionStatus.Suspended: return 'bg-yellow-100 text-yellow-800';
      case SubscriptionStatus.Cancelled: return 'bg-red-100    text-red-800';
      case SubscriptionStatus.Expired:   return 'bg-orange-100 text-orange-800';
      default:                           return 'bg-gray-100   text-gray-800';
    }
  };

  const statusLabel = (status: SubscriptionStatus) => {
    const map: Record<string, [string, string]> = {
      Active:    ['نشط', 'Active'],    Draft:     ['مسودة', 'Draft'],
      Suspended: ['موقوف', 'Suspended'], Cancelled: ['ملغى', 'Cancelled'],
      Expired:   ['منتهي', 'Expired'],
    };
    return t(map[status]?.[0] ?? status, map[status]?.[1] ?? status, lang);
  };

  const calculateTotal = (sub: Subscription) => sub.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('الاشتراكات', 'Subscriptions', lang)}</h1>
        <div className="flex space-x-3 space-x-reverse">
          <button onClick={handleRunBillingJob} disabled={isBillingRunning}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
            {isBillingRunning
              ? <div className={`animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-600 ${lang === 'ar' ? 'ml-2' : 'mr-2'}`} />
              : <Play className={`-ml-1 ${lang === 'ar' ? 'ml-2' : 'mr-2'} h-5 w-5 text-gray-500`} />}
            {t('تشغيل الفوترة', 'Run Billing Job', lang)}
          </button>
          <button onClick={() => { setEditingId(null); setIsModalOpen(true); }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Plus className={`-ml-1 ${lang === 'ar' ? 'ml-2' : 'mr-2'} h-5 w-5`} />
            {t('اشتراك جديد', 'New Subscription', lang)}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative rounded-md shadow-sm max-w-md">
            <div className={`absolute inset-y-0 ${lang === 'ar' ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text"
              className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full ${lang === 'ar' ? 'pr-10 text-right' : 'pl-10'} sm:text-sm border-gray-300 rounded-md`}
              placeholder={t('بحث بالاسم أو الطرف...', 'Search by name or counterparty...', lang)}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} dir={lang === 'ar' ? 'rtl' : 'ltr'} />
          </div>
        </div>

        {loading.subscriptions ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" />
            <p className="mt-2 text-gray-500">{t('جارٍ التحميل...', 'Loading subscriptions...', lang)}</p>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t('لا توجد اشتراكات.', 'No subscriptions found.', lang)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>
                {[
                  t('الاسم', 'Name', lang), t('الطرف', 'Counterparty', lang),
                  t('الحالة', 'Status', lang), t('المبلغ', 'Amount', lang),
                  t('الدورة', 'Cycle', lang), t('الفاتورة القادمة', 'Next Invoice', lang), '',
                ].map((h, i) => (
                  <th key={i} scope="col" className={`px-6 py-3 ${lang === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscriptions.map(sub => (
                  <tr key={sub.id} className={`hover:bg-gray-50 ${confirmDeleteId === sub.id ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-indigo-600">{sub.name}</div>
                      <div className="text-xs text-gray-500">{sub.direction}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{counterpartyNames[sub.counterpartyId] || t('غير معروف', 'Unknown', lang)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(sub.status)}`}>{statusLabel(sub.status)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.currency} {calculateTotal(sub).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.billingCycle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.nextInvoiceDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3 space-x-reverse">
                      <button onClick={() => { setEditingId(sub.id); setIsModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900">
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDelete(sub.id)}
                        className={`transition-colors ${confirmDeleteId === sub.id ? 'text-red-700 font-medium text-xs' : 'text-red-400 hover:text-red-600'}`}
                        title={confirmDeleteId === sub.id ? t('اضغط مرة أخرى للتأكيد', 'Click again to confirm', lang) : t('حذف', 'Delete', lang)}>
                        {confirmDeleteId === sub.id ? t('تأكيد الحذف', 'Confirm Delete', lang) : <Trash2 className="h-5 w-5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <SubscriptionForm
          initialData={editingId ? subscriptions.find(s => s.id === editingId) : undefined}
          onSave={handleSave}
          onCancel={() => { setIsModalOpen(false); setEditingId(null); }}
        />
      )}
    </div>
  );
}
