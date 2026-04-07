import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Play } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/ui/Toast';
import { 
  Subscription, 
  SubscriptionStatus, 
  BillingDocument, 
  DocumentType, 
  DocumentDirection, 
  DocumentStatus, 
  BillingLineItem, 
  TaxProfile 
} from '../types';
import SubscriptionForm from '../components/SubscriptionForm';

export default function Subscriptions() {
  const { 
    subscriptions, 
    addBillingDocument, 
    addSubscription,
    updateSubscription,
    deleteSubscription,
    counterparties,
    loading 
  } = useApp();
  const { addToast } = useToast();
  const [isBillingRunning, setIsBillingRunning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const counterpartyNames = Object.fromEntries(
    counterparties.map(c => [c.id, c.name])
  );

  const handleSave = async (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingId) {
        await updateSubscription(editingId, data);
      } else {
        await addSubscription(data);
      }
      setIsModalOpen(false);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving subscription:", error);
    }
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingId(subscription.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        await deleteSubscription(id);
      } catch (error) {
        console.error("Error deleting subscription:", error);
      }
    }
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

  const calculateTotal = (sub: Subscription) => {
    return sub.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleRunBillingJob = async () => {
    setIsBillingRunning(true);
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const dueSubscriptions = subscriptions.filter(sub => 
        sub.status === SubscriptionStatus.Active && 
        sub.nextInvoiceDate <= todayStr
      );

      if (dueSubscriptions.length === 0) {
        addToast('info', 'No subscriptions due for billing');
        setIsBillingRunning(false);
        return;
      }

      let count = 0;
      for (const sub of dueSubscriptions) {
        const lines: BillingLineItem[] = sub.items.map(item => {
          const subtotal = item.quantity * item.unitPrice;
          const taxRate = item.taxCode === TaxProfile.Standard ? 0.15 : 0;
          const taxAmount = subtotal * taxRate;
          return {
            id: crypto.randomUUID(),
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxCode: item.taxCode,
            taxAmount,
            subtotal,
            total: subtotal + taxAmount,
          };
        });

        const subtotal = lines.reduce((sum, l) => sum + l.subtotal, 0);
        const taxTotal = lines.reduce((sum, l) => sum + l.taxAmount, 0);
        const total = subtotal + taxTotal;

        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + sub.paymentTermsDays);

        const newDoc: Omit<BillingDocument, 'id' | 'createdAt' | 'updatedAt'> = {
          documentNumber: '',
          type: DocumentType.Invoice,
          direction: sub.direction === 'AR' ? DocumentDirection.AR : DocumentDirection.AP,
          status: DocumentStatus.Draft,
          date: todayStr,
          dueDate: dueDate.toISOString().split('T')[0],
          counterpartyId: sub.counterpartyId,
          counterpartyName: counterpartyNames[sub.counterpartyId] || 'Unknown',
          subscriptionId: sub.id,
          currency: sub.currency,
          exchangeRate: 1,
          lines,
          subtotal,
          taxTotal,
          total,
          balance: total,
          paidAmount: 0,
          taxProfile: TaxProfile.Standard,
          notes: `Generated from subscription ${sub.name}`
        };

        await addBillingDocument(newDoc);

        const nextDate = new Date(sub.nextInvoiceDate);
        if (sub.billingCycle === 'Monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        else if (sub.billingCycle === 'Quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
        else if (sub.billingCycle === 'Yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
        else if (sub.billingCycle === 'Custom' && sub.billingInterval) nextDate.setMonth(nextDate.getMonth() + sub.billingInterval);

        await updateSubscription(sub.id, {
          lastInvoiceDate: todayStr,
          nextInvoiceDate: nextDate.toISOString().split('T')[0]
        });

        count++;
      }

      addToast('success', `${count} invoice draft(s) created`);
    } catch (error) {
      console.error(error);
      addToast('error', 'Billing Job Failed');
    } finally {
      setIsBillingRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleRunBillingJob}
            disabled={isBillingRunning}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isBillingRunning ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-600 mr-2"></div>
            ) : (
              <Play className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
            )}
            Run Billing Job
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            New Subscription
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative rounded-md shadow-sm max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Search by name or counterparty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading.subscriptions ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-500">Loading subscriptions...</p>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No subscriptions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Counterparty
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cycle
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Invoice
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-indigo-600">{sub.name}</div>
                      <div className="text-xs text-gray-500">{sub.direction}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{counterpartyNames[sub.counterpartyId] || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sub.currency} {calculateTotal(sub).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sub.billingCycle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sub.nextInvoiceDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(sub)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
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
          onCancel={() => {
            setIsModalOpen(false);
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}
