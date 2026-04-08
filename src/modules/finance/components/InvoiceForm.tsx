import React, { useState, useEffect } from 'react';
import { 
  BillingDocument, 
  DocumentType, 
  DocumentDirection, 
  DocumentStatus, 
  Currency, 
  TaxProfile, 
  BillingLineItem
} from '../types';
import { X, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface InvoiceFormProps {
  initialData?: BillingDocument;
  onSave: (data: Omit<BillingDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export default function InvoiceForm({ initialData, onSave, onCancel }: InvoiceFormProps) {
  const { counterparties, projects } = useApp();
  const [formData, setFormData] = useState<Omit<BillingDocument, 'id' | 'createdAt' | 'updatedAt'>>({
    documentNumber: '',
    type: DocumentType.Invoice,
    direction: DocumentDirection.AR,
    status: DocumentStatus.Draft,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    counterpartyId: '',
    counterpartyName: '',
    currency: Currency.USD,
    exchangeRate: 1,
    lines: [],
    subtotal: 0,
    taxTotal: 0,
    total: 0,
    balance: 0,
    paidAmount: 0,
    taxProfile: TaxProfile.Standard,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      const { id, createdAt, updatedAt, ...rest } = initialData;
      setFormData(rest);
    }
  }, [initialData]);

  const calculateTotals = (lines: BillingLineItem[]) => {
    const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
    const taxTotal = lines.reduce((sum, line) => sum + line.taxAmount, 0);
    const total = subtotal + taxTotal;
    return { subtotal, taxTotal, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const totals = calculateTotals(formData.lines);
      const dataToSave = {
        ...formData,
        ...totals,
        balance: totals.total - formData.paidAmount,
        counterpartyName: counterparties.find(c => c.id === formData.counterpartyId)?.name || ''
      };
      await onSave(dataToSave);
    } catch (error) {
      console.error("Error saving invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'exchangeRate' || name === 'paidAmount' ? parseFloat(value) || 0 : value
    }));
  };

  // Line Item Management
  const addLine = () => {
    const newLine: BillingLineItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxCode: TaxProfile.Standard,
      taxAmount: 0,
      subtotal: 0,
      total: 0
    };
    setFormData(prev => ({ ...prev, lines: [...prev.lines, newLine] }));
  };

  const updateLine = (id: string, field: keyof BillingLineItem, value: any) => {
    setFormData(prev => {
      const newLines = prev.lines.map(line => {
        if (line.id !== id) return line;
        
        const updatedLine = { ...line, [field]: value };
        
        // Recalculate line totals
        if (field === 'quantity' || field === 'unitPrice' || field === 'taxCode') {
          updatedLine.subtotal = updatedLine.quantity * updatedLine.unitPrice;
          
          // Simple tax calculation logic
          let taxRate = 0;
          if (updatedLine.taxCode === TaxProfile.Standard) taxRate = 0.15;
          
          updatedLine.taxAmount = updatedLine.subtotal * taxRate;
          updatedLine.total = updatedLine.subtotal + updatedLine.taxAmount;
        }
        
        return updatedLine;
      });

      const totals = calculateTotals(newLines);
      
      return {
        ...prev,
        lines: newLines,
        ...totals,
        balance: totals.total - prev.paidAmount
      };
    });
  };

  const removeLine = (id: string) => {
    setFormData(prev => {
      const newLines = prev.lines.filter(line => line.id !== id);
      const totals = calculateTotals(newLines);
      return {
        ...prev,
        lines: newLines,
        ...totals,
        balance: totals.total - prev.paidAmount
      };
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {initialData ? 'Edit Invoice' : 'New Invoice'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-500">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
            <div>
              <label htmlFor="documentNumber" className="form-label">Document Number</label>
              <input
                type="text"
                name="documentNumber"
                id="documentNumber"
                value={formData.documentNumber || ''}
                onChange={handleChange}
                placeholder="Auto-generated if empty"
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="type" className="form-label">Type</label>
              <select
                name="type"
                id="type"
                value={formData.type}
                onChange={handleChange}
                className="form-input"
              >
                {Object.values(DocumentType).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="form-label">Status</label>
              <select
                name="status"
                id="status"
                value={formData.status}
                onChange={handleChange}
                className="form-input"
              >
                {Object.values(DocumentStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="counterpartyId" className="form-label">Counterparty *</label>
              <select
                name="counterpartyId"
                id="counterpartyId"
                required
                value={formData.counterpartyId}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Select Counterparty</option>
                {counterparties.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="projectId" className="form-label">Project</label>
              <select
                name="projectId"
                id="projectId"
                value={formData.projectId || ''}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Select Project</option>
                {projects
                  .filter(p => !formData.counterpartyId || p.clientId === formData.counterpartyId)
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
              </select>
            </div>

            <div>
              <label htmlFor="currency" className="form-label">Currency</label>
              <select
                name="currency"
                id="currency"
                value={formData.currency}
                onChange={handleChange}
                className="form-input"
              >
                {Object.values(Currency).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="date" className="form-label">Date</label>
              <input
                type="date"
                name="date"
                id="date"
                value={formData.date}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="dueDate" className="form-label">Due Date</label>
              <input
                type="date"
                name="dueDate"
                id="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="notes" className="form-label">Notes</label>
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

          {/* Line Items */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                <Plus className="-ml-0.5 mr-2 h-4 w-4" />
                Add Line
              </button>
            </div>

            {formData.lines.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No line items added yet.</p>
            ) : (
              <div className="space-y-3">
                {formData.lines.map((line) => (
                  <div key={line.id} className="flex items-start space-x-3 bg-gray-50 p-3 rounded-md">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-5">
                        <label className="block text-xs text-gray-500 mb-1">Description</label>
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                          className="form-input"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="form-input"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Unit Price</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(e) => updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="form-input"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-xs text-gray-500 mb-1">Tax Code</label>
                        <select
                          value={line.taxCode}
                          onChange={(e) => updateLine(line.id, 'taxCode', e.target.value)}
                          className="form-input"
                        >
                          {Object.values(TaxProfile).map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="mt-6 text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                
                <div className="flex flex-col items-end pt-4 space-y-1">
                  <div className="flex justify-between w-48 text-sm text-gray-600">
                    <span>Subtotal:</span>
                    <span>{formData.currency} {formData.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between w-48 text-sm text-gray-600">
                    <span>Tax:</span>
                    <span>{formData.currency} {formData.taxTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between w-48 text-base font-bold text-gray-900 border-t border-gray-300 pt-1">
                    <span>Total:</span>
                    <span>{formData.currency} {formData.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Saving...' : 'Save Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}
