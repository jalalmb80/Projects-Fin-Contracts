import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Subscription, 
  SubscriptionStatus, 
  SubscriptionDirection, 
  BillingCycle, 
  InvoiceTiming, 
  Currency, 
  TaxProfile,
  SubscriptionItem
} from '../types';
import { ChevronLeft, Plus, Trash2, Save } from 'lucide-react';

export default function SubscriptionFormPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // If editing existing
  const { 
    addSubscription, 
    updateSubscription, 
    subscriptions, 
    counterparties, 
    projects, 
    legalEntities, 
    settings,
    loading 
  } = useApp();

  const [formData, setFormData] = useState<Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    legalEntityId: '',
    direction: SubscriptionDirection.AR,
    counterpartyId: '',
    linkedProjectId: '',
    status: SubscriptionStatus.Draft,
    currency: settings.defaultCurrency,
    startDate: new Date().toISOString().split('T')[0],
    contractEndDate: '',
    billingCycle: BillingCycle.Monthly,
    billingInterval: 1,
    invoiceTiming: InvoiceTiming.InAdvance,
    paymentTermsDays: 30,
    autoRenew: true,
    nextInvoiceDate: new Date().toISOString().split('T')[0],
    items: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing data if editing
  useEffect(() => {
    if (id && subscriptions.length > 0) {
      const existing = subscriptions.find(s => s.id === id);
      if (existing) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _, createdAt, updatedAt, ...rest } = existing;
        setFormData(rest);
      }
    }
  }, [id, subscriptions]);

  // Filter counterparties based on direction
  const filteredCounterparties = counterparties.filter(c => {
    if (formData.direction === SubscriptionDirection.AR) return c.type === 'CUSTOMER' || c.type === 'BOTH';
    if (formData.direction === SubscriptionDirection.AP) return c.type === 'VENDOR' || c.type === 'BOTH';
    return true;
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => {
      const newData = { 
        ...prev, 
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
      };
      
      // Auto-update currency based on counterparty
      if (name === 'counterpartyId') {
        const cp = counterparties.find(c => c.id === value);
        if (cp) {
          newData.currency = cp.currency;
          newData.paymentTermsDays = cp.paymentTermsDays;
        }
      }

      return newData;
    });
  };

  // Item Management
  const addItem = () => {
    const newItem: SubscriptionItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxCode: TaxProfile.Standard
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const updateItem = (id: string, field: keyof SubscriptionItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (id) {
        await updateSubscription(id, formData);
      } else {
        await addSubscription(formData);
      }
      navigate('/subscriptions');
    } catch (error) {
      console.error("Error saving subscription:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading.counterparties || loading.projects) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/subscriptions')} className="text-gray-400 hover:text-gray-500">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {id ? 'Edit Subscription' : 'New Subscription'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg overflow-hidden p-6 space-y-8">
        {/* Direction Toggle */}
        <div className="flex justify-center">
          <div className="bg-gray-100 p-1 rounded-lg inline-flex">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, direction: SubscriptionDirection.AR }))}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                formData.direction === SubscriptionDirection.AR 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              AR (We Bill)
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, direction: SubscriptionDirection.AP }))}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                formData.direction === SubscriptionDirection.AP 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              AP (We Pay)
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Subscription Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g. Monthly Retainer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {formData.direction === SubscriptionDirection.AR ? 'Customer' : 'Vendor'}
            </label>
            <select
              name="counterpartyId"
              required
              value={formData.counterpartyId}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select...</option>
              {filteredCounterparties.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Legal Entity</label>
            <select
              name="legalEntityId"
              required
              value={formData.legalEntityId}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select Entity...</option>
              {legalEntities.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Project (Optional)</label>
            <select
              name="linkedProjectId"
              value={formData.linkedProjectId || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">None</option>
              {projects
                .filter(p => !formData.counterpartyId || p.clientId === formData.counterpartyId)
                .map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {Object.values(SubscriptionStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Billing Schedule */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Schedule</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                name="startDate"
                required
                value={formData.startDate}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Next Invoice Date</label>
              <input
                type="date"
                name="nextInvoiceDate"
                required
                value={formData.nextInvoiceDate}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
              <input
                type="date"
                name="contractEndDate"
                value={formData.contractEndDate || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Billing Cycle</label>
              <select
                name="billingCycle"
                value={formData.billingCycle}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {Object.values(BillingCycle).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Timing</label>
              <select
                name="invoiceTiming"
                value={formData.invoiceTiming}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {Object.values(InvoiceTiming).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Terms (Days)</label>
              <input
                type="number"
                name="paymentTermsDays"
                min="0"
                value={formData.paymentTermsDays}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-3 flex items-center">
              <input
                id="autoRenew"
                name="autoRenew"
                type="checkbox"
                checked={formData.autoRenew}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="autoRenew" className="ml-2 block text-sm text-gray-900">
                Auto-renew subscription
              </label>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Subscription Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              <Plus className="-ml-0.5 mr-2 h-4 w-4" />
              Add Item
            </button>
          </div>

          {formData.items.length === 0 ? (
            <p className="text-gray-500 text-sm italic py-4 text-center bg-gray-50 rounded-md">
              No items added yet.
            </p>
          ) : (
            <div className="space-y-3">
              {formData.items.map((item) => (
                <div key={item.id} className="flex items-start space-x-3 bg-gray-50 p-3 rounded-md border border-gray-200">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5">
                      <label className="block text-xs text-gray-500 mb-1">Description</label>
                      <input
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Unit Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs text-gray-500 mb-1">Tax Code</label>
                      <select
                        value={item.taxCode}
                        onChange={(e) => updateItem(item.id, 'taxCode', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        {Object.values(TaxProfile).map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="mt-6 text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/subscriptions')}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none mr-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none disabled:opacity-50"
          >
            <Save className="mr-2 h-5 w-5" />
            {isSubmitting ? 'Saving...' : 'Save Subscription'}
          </button>
        </div>
      </form>
    </div>
  );
}
