import React, { useState, useEffect } from 'react';
import { Counterparty, CounterpartyType, Currency } from '../types';
import { X } from 'lucide-react';

interface CounterpartyFormProps {
  initialData?: Counterparty;
  onSave: (data: Omit<Counterparty, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
}

export default function CounterpartyForm({ initialData, onSave, onCancel }: CounterpartyFormProps) {
  const [formData, setFormData] = useState<Omit<Counterparty, 'id' | 'createdAt'>>({
    name: '',
    type: CounterpartyType.CUSTOMER,
    taxId: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    paymentTermsDays: 30,
    currency: Currency.USD,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      const { id, createdAt, ...rest } = initialData;
      setFormData(rest);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving counterparty:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'paymentTermsDays' ? parseInt(value) || 0 : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {initialData ? 'Edit Counterparty' : 'New Counterparty'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-500">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="form-label">
                Name *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="type" className="form-label">
                Type *
              </label>
              <select
                name="type"
                id="type"
                required
                value={formData.type}
                onChange={handleChange}
                className="form-input"
              >
                {Object.values(CounterpartyType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="currency" className="form-label">
                Currency *
              </label>
              <select
                name="currency"
                id="currency"
                required
                value={formData.currency}
                onChange={handleChange}
                className="form-input"
              >
                {Object.values(Currency).map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="taxId" className="form-label">
                Tax ID
              </label>
              <input
                type="text"
                name="taxId"
                id="taxId"
                value={formData.taxId || ''}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="paymentTermsDays" className="form-label">
                Payment Terms (Days)
              </label>
              <input
                type="number"
                name="paymentTermsDays"
                id="paymentTermsDays"
                min="0"
                value={formData.paymentTermsDays}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address" className="form-label">
                Address
              </label>
              <textarea
                name="address"
                id="address"
                rows={3}
                value={formData.address || ''}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="contactPerson" className="form-label">
                Contact Person
              </label>
              <input
                type="text"
                name="contactPerson"
                id="contactPerson"
                value={formData.contactPerson || ''}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="phone" className="form-label">
                Phone
              </label>
              <input
                type="text"
                name="phone"
                id="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="form-label">
                Notes
              </label>
              <textarea
                name="notes"
                id="notes"
                rows={2}
                value={formData.notes || ''}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
