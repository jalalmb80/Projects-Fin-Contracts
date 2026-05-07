import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/ui/Toast';
import { 
  DocumentStatus, 
  DocumentDirection, 
  PaymentMethod, 
  PaymentDirection 
} from '../types';
import { 
  ChevronLeft, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Edit2,
  Send,
  XCircle
} from 'lucide-react';

export default function BillingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { 
    billingDocuments, 
    counterparties, 
    legalEntities, 
    payments,
    issueDocument,
    submitForApproval,
    approveDocument,
    markAsSent,
    voidDocument,
    returnToDraft,
    recordPayment,
    allocatePayment,
    loading
  } = useApp();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BANK);
  const [paymentReference, setPaymentReference] = useState('');

  if (loading.billingDocuments) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const document = billingDocuments.find(d => d.id === id);

  if (!document) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Document not found</h2>
        <Link to="/finance/billing" className="mt-4 text-indigo-600 hover:text-indigo-500">
          Back to Billing
        </Link>
      </div>
    );
  }

  const counterparty = counterparties.find(c => c.id === document.counterpartyId);
  const fromEntity   = legalEntities.find(e => e.id === document.fromEntityId);
  const toEntity     = legalEntities.find(e => e.id === document.toEntityId);

  const relatedPayments = payments.flatMap(p =>
    p.allocations
      .filter(a => a.invoiceId === document.id)
      .map(a => ({ paymentId: p.id, date: p.date, method: p.method, reference: p.reference, amount: a.amount, currency: p.currency }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.Paid:    return 'bg-green-100 text-green-800';
      case DocumentStatus.Sent:    return 'bg-blue-100 text-blue-800';
      case DocumentStatus.Issued:  return 'bg-blue-50 text-blue-600';
      case DocumentStatus.Overdue: return 'bg-red-100 text-red-800';
      case DocumentStatus.Draft:   return 'bg-gray-100 text-gray-800';
      case DocumentStatus.Void:    return 'bg-gray-200 text-gray-500';
      default:                     return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: document.currency, maximumFractionDigits: 2 }).format(amount);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0 || paymentAmount > document.balance) {
      addToast('error', 'Invalid payment amount');
      return;
    }
    try {
      const paymentId = await recordPayment({
        date: paymentDate, amount: paymentAmount, currency: document.currency,
        counterpartyId: document.counterpartyId,
        direction: document.direction === DocumentDirection.AR ? PaymentDirection.IN : PaymentDirection.OUT,
        method: paymentMethod, reference: paymentReference,
        allocations: [], unallocatedAmount: paymentAmount,
      });
      await allocatePayment(paymentId, document.id, paymentAmount);
      setIsPaymentModalOpen(false);
    } catch (error) {
      console.error('Payment failed', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-4">
            <Link to="/finance/billing" className="mt-1 text-gray-400 hover:text-gray-500">
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">{document.documentNumber || 'Draft Invoice'}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">{document.type}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>{document.status}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Created on {new Date(document.date).toLocaleDateString()} • Due {new Date(document.dueDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {document.status === DocumentStatus.Draft && (
              <>
                <button onClick={() => submitForApproval(document.id)} className="text-sm px-3 py-2 border rounded hover:bg-gray-50">Submit for Approval</button>
                <button onClick={() => navigate(`/finance/billing/new?id=${document.id}`)} className="text-sm px-3 py-2 border rounded hover:bg-gray-50 flex items-center">
                  <Edit2 className="h-4 w-4 mr-1" /> Edit
                </button>
              </>
            )}
            {document.status === DocumentStatus.PendingApproval && (
              <>
                <button onClick={() => approveDocument(document.id)} className="bg-green-600 text-white text-sm px-3 py-2 rounded hover:bg-green-700 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve
                </button>
                <button onClick={() => returnToDraft(document.id)} className="bg-gray-100 text-gray-700 text-sm px-3 py-2 rounded hover:bg-gray-200">Return to Draft</button>
              </>
            )}
            {document.status === DocumentStatus.Approved && (
              <button onClick={() => issueDocument(document.id)} className="bg-indigo-600 text-white text-sm px-3 py-2 rounded hover:bg-indigo-700 flex items-center">
                <FileText className="h-4 w-4 mr-1" /> Issue Document
              </button>
            )}
            {(document.status === DocumentStatus.Issued || document.status === DocumentStatus.Sent || document.status === DocumentStatus.PartiallyPaid || document.status === DocumentStatus.Overdue) && (
              <>
                <button onClick={() => { setPaymentAmount(document.balance); setIsPaymentModalOpen(true); }} className="bg-green-600 text-white text-sm px-3 py-2 rounded hover:bg-green-700 flex items-center">
                  <CreditCard className="h-4 w-4 mr-1" /> Record Payment
                </button>
                {document.status === DocumentStatus.Issued && (
                  <button onClick={() => markAsSent(document.id)} className="bg-blue-600 text-white text-sm px-3 py-2 rounded hover:bg-blue-700 flex items-center">
                    <Send className="h-4 w-4 mr-1" /> Mark as Sent
                  </button>
                )}
                <button onClick={() => voidDocument(document.id)} className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded hover:bg-red-100 flex items-center">
                  <XCircle className="h-4 w-4 mr-1" /> Void
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200"><h3 className="text-lg font-medium leading-6 text-gray-900">Line Items</h3></div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {document.lines.map(line => (
                    <tr key={line.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{line.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{line.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{formatCurrency(line.unitPrice)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{formatCurrency(line.taxAmount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">{formatCurrency(line.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col items-end space-y-2">
                <div className="flex justify-between w-64 text-sm text-gray-600"><span>Subtotal:</span><span>{formatCurrency(document.subtotal)}</span></div>
                <div className="flex justify-between w-64 text-sm text-gray-600"><span>Tax Total:</span><span>{formatCurrency(document.taxTotal)}</span></div>
                <div className="flex justify-between w-64 text-base font-bold text-gray-900 border-t border-gray-300 pt-2"><span>Total:</span><span>{formatCurrency(document.total)}</span></div>
                <div className="flex justify-between w-64 text-sm text-green-600"><span>Paid to Date:</span><span>{formatCurrency(document.paidAmount)}</span></div>
                <div className="flex justify-between w-64 text-base font-bold text-indigo-600 border-t border-gray-300 pt-2"><span>Balance Due:</span><span>{formatCurrency(document.balance)}</span></div>
              </div>
            </div>
          </div>

          {relatedPayments.length > 0 && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200"><h3 className="text-lg font-medium leading-6 text-gray-900">Payment History</h3></div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {relatedPayments.map((payment, index) => (
                      <tr key={`${payment.paymentId}-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(payment.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.method}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.reference || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">{formatCurrency(payment.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
              {document.direction === DocumentDirection.AR ? 'Bill To' : 'Bill From'}
            </h3>
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                {document.counterpartyName.charAt(0)}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{document.counterpartyName}</p>
                <p className="text-xs text-gray-500">{counterparty?.email}</p>
              </div>
            </div>
            {document.direction === DocumentDirection.IC && fromEntity && toEntity && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Inter-Company Route:</p>
                <div className="flex items-center text-sm">
                  <span className="font-medium">{fromEntity.name}</span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="font-medium">{toEntity.name}</span>
                </div>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500 space-y-1">
              <p>{counterparty?.address || 'No address on file'}</p>
              <p>{counterparty?.phone}</p>
            </div>
          </div>
          {document.notes && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{document.notes}</p>
            </div>
          )}
        </div>
      </div>

      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Record Payment</h3>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">$</span></div>
                  <input type="number" step="0.01" required max={document.balance} value={paymentAmount} onChange={e => setPaymentAmount(parseFloat(e.target.value))}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md" />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">{document.currency}</span></div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input type="date" required value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reference / Check #</label>
                <input type="text" value={paymentReference} onChange={e => setPaymentReference(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div className="mt-5 sm:mt-6 flex space-x-3">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:text-sm">
                  Cancel
                </button>
                <button type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:text-sm">
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
