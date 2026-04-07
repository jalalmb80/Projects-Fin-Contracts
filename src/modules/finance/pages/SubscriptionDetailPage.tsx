import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  SubscriptionStatus, 
  DocumentDirection, 
  DocumentStatus 
} from '../types';
import { 
  ChevronLeft, 
  Edit2, 
  Play, 
  Pause, 
  XCircle, 
  FileText,
  Repeat
} from 'lucide-react';

export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { 
    subscriptions, 
    counterparties, 
    billingDocuments, 
    updateSubscription,
    loading 
  } = useApp();

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
        <h2 className="text-2xl font-bold text-gray-900">Subscription not found</h2>
        <Link to="/finance/subscriptions" className="mt-4 text-indigo-600 hover:text-indigo-500">
          Back to Subscriptions
        </Link>
      </div>
    );
  }

  const counterparty = counterparties.find(c => c.id === subscription.counterpartyId);
  const relatedInvoices = billingDocuments.filter(d => d.subscriptionId === subscription.id);

  const totalAmount = subscription.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const handleStatusChange = async (newStatus: SubscriptionStatus) => {
    if (window.confirm(`Are you sure you want to change status to ${newStatus}?`)) {
      await updateSubscription(subscription.id, { status: newStatus });
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: subscription.currency,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-4">
            <Link to="/finance/subscriptions" className="mt-1 text-gray-400 hover:text-gray-500">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">{subscription.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                  {subscription.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {counterparty?.name || 'Unknown'} • {subscription.billingCycle} • Next Invoice: {new Date(subscription.nextInvoiceDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Link 
              to={`/subscriptions/new?id=${subscription.id}`} // Ideally we'd have a proper edit route
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Link>
            
            {subscription.status === SubscriptionStatus.Active ? (
              <button 
                onClick={() => handleStatusChange(SubscriptionStatus.Suspended)}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
              >
                <Pause className="h-4 w-4 mr-2" />
                Suspend
              </button>
            ) : subscription.status === SubscriptionStatus.Suspended || subscription.status === SubscriptionStatus.Draft ? (
              <button 
                onClick={() => handleStatusChange(SubscriptionStatus.Active)}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Activate
              </button>
            ) : null}

            {subscription.status !== SubscriptionStatus.Cancelled && (
              <button 
                onClick={() => handleStatusChange(SubscriptionStatus.Cancelled)}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Subscription Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscription.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-medium">
                    <td colSpan={3} className="px-6 py-4 text-right text-sm text-gray-900">Total per Cycle:</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">{formatCurrency(totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice History */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Invoice History</h3>
            </div>
            {relatedInvoices.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No invoices generated yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="relative px-6 py-3"><span className="sr-only">View</span></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {relatedInvoices.map((doc) => (
                      <tr key={doc.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                          {doc.documentNumber || 'Draft'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(doc.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${doc.status === DocumentStatus.Paid ? 'bg-green-100 text-green-800' : 
                              doc.status === DocumentStatus.Overdue ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatCurrency(doc.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link to={`/billing/${doc.id}`} className="text-indigo-600 hover:text-indigo-900">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Details</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(subscription.startDate).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">End Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {subscription.contractEndDate ? new Date(subscription.contractEndDate).toLocaleDateString() : 'Indefinite'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Auto Renew</dt>
                <dd className="mt-1 text-sm text-gray-900">{subscription.autoRenew ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Payment Terms</dt>
                <dd className="mt-1 text-sm text-gray-900">{subscription.paymentTermsDays} Days</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
