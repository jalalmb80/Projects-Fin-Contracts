import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Play } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLang, t } from '../context/LanguageContext';
import { useToast } from '../components/ui/Toast';
import {
  Subscription, SubscriptionStatus, BillingDocument,
  DocumentType, DocumentDirection, DocumentStatus, BillingLineItem, TaxProfile
} from '../types';
import SubscriptionForm from '../components/SubscriptionForm';

export default function Subscriptions() {
  const { subscriptions, addBillingDocument, addSubscription, updateSubscription, deleteSubscription, counterparties, loading } = useApp();
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
    } catch (error) { console.error('Error saving subscription:', error); }
  };

  const handleEdit = (s: Subscription) => { setEditingId(s.id); setIsModalOpen(true); };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return; }
    setConfirmDeleteId(null);
    try {
      await deleteSubscription(id);
      addToast('success', t('\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u0627\u0634\u062a\u0631\u0627\u0643', 'Subscription deleted', lang));
    } catch { addToast('error', t('\u0641\u0634\u0644 \u0627\u0644\u062d\u0630\u0641', 'Failed to delete', lang)); }
  };

  const filteredSubscriptions = subscriptions.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (counterpartyNames[s.counterpartyId] || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: SubscriptionStatus) => {
    switch (status) {
      case SubscriptionStatus.Active: return 'bg-green-100 text-green-800';
      case SubscriptionStatus.Draft: return 'bg-gray-100 text-gray-800';
      case SubscriptionStatus.Suspended: return 'bg-yellow-100 text-yellow-800';
      case SubscriptionStatus.Cancelled: return 'bg-red-100 text-red-800';
      case SubscriptionStatus.Expired: return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statusLabel = (status: SubscriptionStatus) => {
    const map: Record<string, [string, string]> = {
      Active: ['\u0646\u0634\u0637','Active'], Draft: ['\u0645\u0633\u0648\u062f\u0629','Draft'],
      Suspended: ['\u0645\u0648\u0642\u0648\u0641','Suspended'], Cancelled: ['\u0645\u0644\u063a\u0649','Cancelled'], Expired: ['\u0645\u0646\u062a\u0647\u064a','Expired'],
    };
    return t(map[status]?.[0] ?? status, map[status]?.[1] ?? status, lang);
  };

  const calculateTotal = (sub: Subscription) => sub.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleRunBillingJob = async () => {
    setIsBillingRunning(true);
    try {
      const today = new Date(); const todayStr = today.toISOString().split('T')[0];
      const due = subscriptions.filter(sub => sub.status === SubscriptionStatus.Active && sub.nextInvoiceDate <= todayStr);
      if (due.length === 0) { addToast('info', t('\u0644\u0627 \u062a\u0648\u062c\u062f \u0627\u0634\u062a\u0631\u0627\u0643\u0627\u062a \u0645\u0633\u062a\u062d\u0642\u0629 \u0644\u0644\u0641\u0648\u062a\u0631\u0629', 'No subscriptions due for billing', lang)); setIsBillingRunning(false); return; }
      let count = 0;
      for (const sub of due) {
        const lines: BillingLineItem[] = sub.items.map(item => { const s2 = item.quantity * item.unitPrice; const ta = item.taxCode === TaxProfile.Standard ? s2 * 0.15 : 0; return { id: crypto.randomUUID(), description: item.description, quantity: item.quantity, unitPrice: item.unitPrice, taxCode: item.taxCode, taxAmount: ta, subtotal: s2, total: s2 + ta }; });
        const subtotal = lines.reduce((s2, l) => s2 + l.subtotal, 0); const taxTotal = lines.reduce((s2, l) => s2 + l.taxAmount, 0); const total = subtotal + taxTotal;
        const dd = new Date(today); dd.setDate(dd.getDate() + sub.paymentTermsDays);
        const newDoc: Omit<BillingDocument, 'id' | 'createdAt' | 'updatedAt'> = { documentNumber: '', type: DocumentType.Invoice, direction: sub.direction === 'AR' ? DocumentDirection.AR : DocumentDirection.AP, status: DocumentStatus.Draft, date: todayStr, dueDate: dd.toISOString().split('T')[0], counterpartyId: sub.counterpartyId, counterpartyName: counterpartyNames[sub.counterpartyId] || t('\u063a\u064a\u0631 \u0645\u0639\u0631\u0648\u0641', 'Unknown', lang), subscriptionId: sub.id, currency: sub.currency, exchangeRate: 1, lines, subtotal, taxTotal, total, balance: total, paidAmount: 0, taxProfile: TaxProfile.Standard, notes: `Generated from subscription ${sub.name}` };
        await addBillingDocument(newDoc);
        const nx = new Date(sub.nextInvoiceDate);
        if (sub.billingCycle === 'Monthly') nx.setMonth(nx.getMonth() + 1);
        else if (sub.billingCycle === 'Quarterly') nx.setMonth(nx.getMonth() + 3);
        else if (sub.billingCycle === 'Yearly') nx.setFullYear(nx.getFullYear() + 1);
        else if (sub.billingCycle === 'Custom' && sub.billingInterval) nx.setMonth(nx.getMonth() + sub.billingInterval);
        await updateSubscription(sub.id, { lastInvoiceDate: todayStr, nextInvoiceDate: nx.toISOString().split('T')[0] }); count++;
      }
      addToast('success', t(`\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 ${count} \u0641\u0627\u062a\u0648\u0631\u0629 \u0645\u0633\u0648\u062f\u0629`, `${count} invoice draft(s) created`, lang));
    } catch (error) { console.error(error); addToast('error', t('\u0641\u0634\u0644\u062a \u0639\u0645\u0644\u064a\u0629 \u0627\u0644\u0641\u0648\u062a\u0631\u0629', 'Billing Job Failed', lang)); }
    finally { setIsBillingRunning(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('\u0627\u0644\u0627\u0634\u062a\u0631\u0627\u0643\u0627\u062a', 'Subscriptions', lang)}</h1>
        <div className="flex space-x-3 space-x-reverse">
          <button onClick={handleRunBillingJob} disabled={isBillingRunning} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
            {isBillingRunning ? <div className={`animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-600 ${lang==='ar'?'ml-2':'mr-2'}`}></div> : <Play className={`-ml-1 ${lang==='ar'?'ml-2':'mr-2'} h-5 w-5 text-gray-500`}/>}
            {t('\u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0641\u0648\u062a\u0631\u0629', 'Run Billing Job', lang)}
          </button>
          <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
            <Plus className={`-ml-1 ${lang==='ar'?'ml-2':'mr-2'} h-5 w-5`}/>
            {t('\u0627\u0634\u062a\u0631\u0627\u0643 \u062c\u062f\u064a\u062f', 'New Subscription', lang)}
          </button>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative rounded-md shadow-sm max-w-md">
            <div className={`absolute inset-y-0 ${lang==='ar'?'right-0 pr-3':'left-0 pl-3'} flex items-center pointer-events-none`}><Search className="h-5 w-5 text-gray-400"/></div>
            <input type="text" className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full ${lang==='ar'?'pr-10 text-right':'pl-10'} sm:text-sm border-gray-300 rounded-md`}
              placeholder={t('\u0628\u062d\u062b \u0628\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0627\u0644\u0637\u0631\u0641...', 'Search by name or counterparty...', lang)}
              value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} dir={lang==='ar'?'rtl':'ltr'}/>
          </div>
        </div>
        {loading.subscriptions ? (
          <div className="p-8 text-center"><div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div><p className="mt-2 text-gray-500">{t('\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0645\u064a\u0644...', 'Loading subscriptions...', lang)}</p></div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t('\u0644\u0627 \u062a\u0648\u062c\u062f \u0627\u0634\u062a\u0631\u0627\u0643\u0627\u062a.', 'No subscriptions found.', lang)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>
                {[[t('\u0627\u0644\u0627\u0633\u0645','Name',lang)],[t('\u0627\u0644\u0637\u0631\u0641','Counterparty',lang)],[t('\u0627\u0644\u062d\u0627\u0644\u0629','Status',lang)],[t('\u0627\u0644\u0645\u0628\u0644\u063a','Amount',lang)],[t('\u0627\u0644\u062f\u0648\u0631\u0629','Cycle',lang)],[t('\u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629 \u0627\u0644\u0642\u0627\u062f\u0645\u0629','Next Invoice',lang)],['']].map(([h],i)=>(
                  <th key={i} scope="col" className={`px-6 py-3 ${lang==='ar'?'text-right':'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscriptions.map(sub=>(
                  <tr key={sub.id} className={`hover:bg-gray-50 ${confirmDeleteId===sub.id?'bg-red-50':''}`}>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-indigo-600">{sub.name}</div><div className="text-xs text-gray-500">{sub.direction}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{counterpartyNames[sub.counterpartyId]||t('\u063a\u064a\u0631 \u0645\u0639\u0631\u0648\u0641','Unknown',lang)}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(sub.status)}`}>{statusLabel(sub.status)}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.currency} {calculateTotal(sub).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.billingCycle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.nextInvoiceDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3 space-x-reverse">
                      <button onClick={()=>handleEdit(sub)} className="text-indigo-600 hover:text-indigo-900"><Edit2 className="h-5 w-5"/></button>
                      <button onClick={()=>handleDelete(sub.id)} className={`transition-colors ${confirmDeleteId===sub.id?'text-red-700 font-medium text-xs':'text-red-400 hover:text-red-600'}`}
                        title={confirmDeleteId===sub.id?t('\u0627\u0636\u063a\u0637 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649 \u0644\u0644\u062a\u0623\u0643\u064a\u062f','Click again to confirm',lang):t('\u062d\u0630\u0641','Delete',lang)}>
                        {confirmDeleteId===sub.id?t('\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062d\u0630\u0641','Confirm Delete',lang):<Trash2 className="h-5 w-5"/>}
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
