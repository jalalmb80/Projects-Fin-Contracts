import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLang, t } from '../context/LanguageContext';
import { SubscriptionStatus, DocumentDirection, DocumentStatus } from '../types';
import { ChevronLeft, ChevronRight, Edit2, Play, Pause, XCircle, FileText, Repeat } from 'lucide-react';

export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { subscriptions, counterparties, billingDocuments, updateSubscription, loading } = useApp();
  const { lang } = useLang();
  const [confirmStatus, setConfirmStatus] = useState<SubscriptionStatus | null>(null);

  if (loading.subscriptions) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const subscription = subscriptions.find(s => s.id === id);
  if (!subscription) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">{t('\u0627\u0644\u0627\u0634\u062a\u0631\u0627\u0643 \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f', 'Subscription not found', lang)}</h2>
        <Link to="/finance/subscriptions" className="mt-4 text-indigo-600 hover:text-indigo-500">{t('\u0627\u0644\u0639\u0648\u062f\u0629 \u0644\u0644\u0627\u0634\u062a\u0631\u0627\u0643\u0627\u062a', 'Back to Subscriptions', lang)}</Link>
      </div>
    );
  }

  const counterparty = counterparties.find(c => c.id === subscription.counterpartyId);
  const relatedInvoices = billingDocuments.filter(d => d.subscriptionId === subscription.id);
  const totalAmount = subscription.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleStatusChange = async (newStatus: SubscriptionStatus) => {
    if (confirmStatus !== newStatus) { setConfirmStatus(newStatus); return; }
    setConfirmStatus(null);
    await updateSubscription(subscription.id, { status: newStatus });
  };

  const getStatusColor = (status: SubscriptionStatus) => {
    switch (status) {
      case SubscriptionStatus.Active: return 'bg-green-100 text-green-800';
      case SubscriptionStatus.Draft: return 'bg-gray-100 text-gray-800';
      case SubscriptionStatus.Suspended: return 'bg-yellow-100 text-yellow-800';
      case SubscriptionStatus.Cancelled: return 'bg-red-100 text-red-800';
      case SubscriptionStatus.Expired: return 'bg-gray-200 text-gray-600';
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { style: 'currency', currency: subscription.currency, maximumFractionDigits: 2 }).format(amount);

  const BackIcon = lang === 'ar' ? ChevronRight : ChevronLeft;

  return (
    <div className="space-y-6">
      {confirmStatus && (
        <div className="flex items-center gap-4 bg-yellow-50 border border-yellow-200 rounded-lg px-5 py-4 text-sm text-yellow-800">
          <span className="flex-1">{t(`\u0647\u0644 \u062a\u0631\u064a\u062f \u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u062d\u0627\u0644\u0629 \u0625\u0644\u0649 "${statusLabel(confirmStatus)}"\u061f`, `Change status to "${statusLabel(confirmStatus)}"?`, lang)}</span>
          <button onClick={() => handleStatusChange(confirmStatus)} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-1.5 rounded-lg font-medium">{t('\u062a\u0623\u0643\u064a\u062f', 'Confirm', lang)}</button>
          <button onClick={() => setConfirmStatus(null)} className="text-yellow-600 hover:text-yellow-700 px-3 py-1.5 rounded-lg font-medium">{t('\u0625\u0644\u063a\u0627\u0621', 'Cancel', lang)}</button>
        </div>
      )}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-4 space-x-reverse">
            <Link to="/finance/subscriptions" className="mt-1 text-gray-400 hover:text-gray-500"><BackIcon className="h-6 w-6"/></Link>
            <div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <h1 className="text-2xl font-bold text-gray-900">{subscription.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>{statusLabel(subscription.status)}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{counterparty?.name || t('\u063a\u064a\u0631 \u0645\u0639\u0631\u0648\u0641','Unknown',lang)} \u2022 {subscription.billingCycle} \u2022 {t('\u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629 \u0627\u0644\u0642\u0627\u062f\u0645\u0629:','Next Invoice:',lang)} {new Date(subscription.nextInvoiceDate).toLocaleDateString(lang==='ar'?'ar-SA':'en-US')}</p>
            </div>
          </div>
          <div className="flex space-x-3 space-x-reverse">
            {subscription.status === SubscriptionStatus.Active ? (
              <button onClick={() => handleStatusChange(SubscriptionStatus.Suspended)}
                className={`inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${confirmStatus===SubscriptionStatus.Suspended?'bg-yellow-800':'bg-yellow-600 hover:bg-yellow-700'}`}>
                <Pause className={`h-4 w-4 ${lang==='ar'?'ml-2':'mr-2'}`}/>
                {confirmStatus===SubscriptionStatus.Suspended?t('\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0625\u064a\u0642\u0627\u0641','Confirm Suspend',lang):t('\u0625\u064a\u0642\u0627\u0641','Suspend',lang)}
              </button>
            ) : (subscription.status===SubscriptionStatus.Suspended||subscription.status===SubscriptionStatus.Draft) ? (
              <button onClick={() => handleStatusChange(SubscriptionStatus.Active)}
                className={`inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${confirmStatus===SubscriptionStatus.Active?'bg-green-800':'bg-green-600 hover:bg-green-700'}`}>
                <Play className={`h-4 w-4 ${lang==='ar'?'ml-2':'mr-2'}`}/>
                {confirmStatus===SubscriptionStatus.Active?t('\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062a\u0641\u0639\u064a\u0644','Confirm Activate',lang):t('\u062a\u0641\u0639\u064a\u0644','Activate',lang)}
              </button>
            ) : null}
            {subscription.status !== SubscriptionStatus.Cancelled && (
              <button onClick={() => handleStatusChange(SubscriptionStatus.Cancelled)}
                className={`inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${confirmStatus===SubscriptionStatus.Cancelled?'bg-red-800':'bg-red-600 hover:bg-red-700'}`}>
                <XCircle className={`h-4 w-4 ${lang==='ar'?'ml-2':'mr-2'}`}/>
                {confirmStatus===SubscriptionStatus.Cancelled?t('\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0625\u0644\u063a\u0627\u0621','Confirm Cancel',lang):t('\u0625\u0644\u063a\u0627\u0621','Cancel',lang)}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200"><h3 className="text-lg font-medium leading-6 text-gray-900">{t('\u0628\u0646\u0648\u062f \u0627\u0644\u0627\u0634\u062a\u0631\u0627\u0643','Subscription Items',lang)}</h3></div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"><tr>
                  {[t('\u0627\u0644\u0648\u0635\u0641','Description',lang),t('\u0627\u0644\u0643\u0645\u064a\u0629','Qty',lang),t('\u0633\u0639\u0631 \u0627\u0644\u0648\u062d\u062f\u0629','Unit Price',lang),t('\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a','Total',lang)].map((h,i)=>(
                    <th key={i} className={`px-6 py-3 ${i===0?(lang==='ar'?'text-right':'text-left'):'text-right'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{h}</th>
                  ))}
                </tr></thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscription.items.map(item=>(
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">{formatCurrency(item.quantity*item.unitPrice)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-medium">
                    <td colSpan={3} className="px-6 py-4 text-right text-sm text-gray-900">{t('\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a \u0644\u0643\u0644 \u062f\u0648\u0631\u0629:','Total per Cycle:',lang)}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">{formatCurrency(totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200"><h3 className="text-lg font-medium leading-6 text-gray-900">{t('\u0633\u062c\u0644 \u0627\u0644\u0641\u0648\u0627\u062a\u064a\u0631','Invoice History',lang)}</h3></div>
            {relatedInvoices.length === 0 ? (
              <div className="p-6 text-center text-gray-500">{t('\u0644\u0645 \u064a\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0641\u0648\u0627\u062a\u064a\u0631 \u0628\u0639\u062f.','No invoices generated yet.',lang)}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50"><tr>
                    {[t('\u0631\u0642\u0645 \u0627\u0644\u0645\u0633\u062a\u0646\u062f','Document #',lang),t('\u0627\u0644\u062a\u0627\u0631\u064a\u062e','Date',lang),t('\u0627\u0644\u062d\u0627\u0644\u0629','Status',lang),t('\u0627\u0644\u0645\u0628\u0644\u063a','Amount',lang),''].map((h,i)=>(
                      <th key={i} className={`px-6 py-3 ${i>=3?'text-right':(lang==='ar'?'text-right':'text-left')} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {relatedInvoices.map(doc=>(
                      <tr key={doc.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{doc.documentNumber||t('\u0645\u0633\u0648\u062f\u0629','Draft',lang)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(doc.date).toLocaleDateString(lang==='ar'?'ar-SA':'en-US')}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doc.status===DocumentStatus.Paid?'bg-green-100 text-green-800':doc.status===DocumentStatus.Overdue?'bg-red-100 text-red-800':'bg-gray-100 text-gray-800'}`}>{doc.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(doc.total)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><Link to={`/finance/billing/${doc.id}`} className="text-indigo-600 hover:text-indigo-900">{t('\u0639\u0631\u0636','View',lang)}</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">{t('\u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644','Details',lang)}</h3>
            <dl className="space-y-4">
              {[
                [t('\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0628\u062f\u0621','Start Date',lang),new Date(subscription.startDate).toLocaleDateString(lang==='ar'?'ar-SA':'en-US')],
                [t('\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0627\u0646\u062a\u0647\u0627\u0621','End Date',lang),subscription.contractEndDate?new Date(subscription.contractEndDate).toLocaleDateString(lang==='ar'?'ar-SA':'en-US'):t('\u063a\u064a\u0631 \u0645\u062d\u062f\u062f','Indefinite',lang)],
                [t('\u062a\u062c\u062f\u064a\u062f \u062a\u0644\u0642\u0627\u0626\u064a','Auto Renew',lang),subscription.autoRenew?t('\u0646\u0639\u0645','Yes',lang):t('\u0644\u0627','No',lang)],
                [t('\u0634\u0631\u0648\u0637 \u0627\u0644\u062f\u0641\u0639','Payment Terms',lang),`${subscription.paymentTermsDays} ${t('\u064a\u0648\u0645','Days',lang)}`],
              ].map(([label,value])=>(
                <div key={label as string}><dt className="text-sm font-medium text-gray-500">{label}</dt><dd className="mt-1 text-sm text-gray-900">{value}</dd></div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
