import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  BillingDocument, 
  DocumentType, 
  DocumentDirection, 
  DocumentStatus, 
  Currency, 
  TaxProfile, 
  BillingLineItem
} from '../types';
import { ChevronLeft, Plus, Trash2, Save, AlertCircle } from 'lucide-react';

export default function BillingFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    addBillingDocument, 
    counterparties, 
    projects, 
    legalEntities, 
    settings,
    loading 
  } = useApp();

  const initialType = searchParams.get('type') as any || 'AR';
  
  const [formData, setFormData] = useState<Omit<BillingDocument, 'id' | 'createdAt' | 'updatedAt'>>({
    documentNumber: '',
    type: initialType === 'CreditNote' ? DocumentType.CreditNote : DocumentType.Invoice,
    direction: initialType === 'AP' ? DocumentDirection.AP : initialType === 'IC' ? DocumentDirection.IC : DocumentDirection.AR,
    status: DocumentStatus.Draft,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    counterpartyId: '',
    counterpartyName: '',
    currency: settings.defaultCurrency,
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter counterparties based on direction
  const filteredCounterparties = counterparties.filter(c => {
    if (formData.direction === DocumentDirection.AR) return c.type === 'CUSTOMER' || c.type === 'BOTH';
    if (formData.direction === DocumentDirection.AP) return c.type === 'VENDOR' || c.type === 'BOTH';
    if (formData.direction === DocumentDirection.IC) return c.type === 'INTERCOMPANY';
    return true;
  });

  const calculateTotals = (lines: BillingLineItem[]) => {
    const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
    const taxTotal = lines.reduce((sum, line) => sum + line.taxAmount, 0);
    const total = subtotal + taxTotal;
    return { subtotal, taxTotal, total };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-update counterparty name
      if (name === 'counterpartyId') {
        const cp = counterparties.find(c => c.id === value);
        if (cp) {
          newData.counterpartyName = cp.name;
          newData.currency = cp.currency;
          // Auto-calc due date based on payment terms
          const date = new Date(newData.date);
          date.setDate(date.getDate() + cp.paymentTermsDays);
          newData.dueDate = date.toISOString().split('T')[0];
        }
      }

      // Handle Direction Change
      if (name === 'direction') {
        if (value === DocumentDirection.IC) {
          newData.taxProfile = TaxProfile.Intercompany;
          newData.counterpartyId = '';
          newData.counterpartyName = '';
          newData.fromEntityId = '';
          newData.toEntityId = '';
        }
      }

      // Handle Inter-company Entities
      if (name === 'fromEntityId' || name === 'toEntityId') {
         const fromId = name === 'fromEntityId' ? value : newData.fromEntityId;
         const toId = name === 'toEntityId' ? value : newData.toEntityId;
         
         if (fromId && toId) {
            const fromEntity = legalEntities.find(e => e.id === fromId);
            const toEntity = legalEntities.find(e => e.id === toId);
            if (fromEntity && toEntity) {
               newData.counterpartyName = `${fromEntity.name} → ${toEntity.name}`;
               newData.counterpartyId = toId; // Use To Entity as counterparty reference
               newData.currency = fromEntity.currency; // Use From Entity currency
            }
         }
      }

      return newData;
    });
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
          
          let taxRate = 0;
          if (updatedLine.taxCode === TaxProfile.Standard) taxRate = 0.15; // Should come from settings/constants
          
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addBillingDocument(formData);
      navigate('/billing');
    } catch (error) {
      console.error("Error creating document:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading.counterparties || loading.projects) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/billing')} className="text-gray-400 hover:text-gray-500">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">New Billing Document</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg overflow-hidden p-6 space-y-8">
        {/* Top Section: Basic Info */}
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
          <div>
            <label className="form-label">Direction</label>
            <select
              name="direction"
              value={formData.direction}
              onChange={handleChange}
              className="form-input"
            >
              {Object.values(DocumentDirection).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="form-input"
            >
              {Object.values(DocumentType).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {formData.direction === DocumentDirection.IC ? (
            <>
              <div className="sm:col-span-3">
                <div className="rounded-md bg-blue-50 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3 flex-1 md:flex md:justify-between">
                      <p className="text-sm text-blue-700">Inter-company invoices use 0% tax automatically.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="form-label">From Entity</label>
                <select
                  name="fromEntityId"
                  required
                  value={formData.fromEntityId || ''}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select From Entity</option>
                  {legalEntities.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">To Entity</label>
                <select
                  name="toEntityId"
                  required
                  value={formData.toEntityId || ''}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select To Entity</option>
                  {legalEntities
                    .filter(e => e.id !== formData.fromEntityId)
                    .map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className="form-label">Counterparty</label>
              <select
                name="counterpartyId"
                required
                value={formData.counterpartyId}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Select Counterparty</option>
                {filteredCounterparties.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}



          <div>
            <label className="form-label">Date</label>
            <input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Due Date</label>
            <input
              type="date"
              name="dueDate"
              required
              value={formData.dueDate}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Project (Optional)</label>
            <select
              name="projectId"
              value={formData.projectId || ''}
              onChange={handleChange}
              className="form-input"
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
            <label className="form-label">Currency</label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="form-input"
            >
              {Object.values(Currency).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
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
            <p className="text-gray-500 text-sm italic py-4 text-center bg-gray-50 rounded-md">
              No line items added yet. Click "Add Line" to start.
            </p>
          ) : (
            <div className="space-y-3">
              {formData.lines.map((line) => (
                <div key={line.id} className="flex items-start space-x-3 bg-gray-50 p-3 rounded-md border border-gray-200">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5">
                      <label className="block text-xs text-gray-500 mb-1">Description</label>
                      <input
                        type="text"
                        required
                        value={line.description}
                        onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        required
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
                        required
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
              
              <div className="flex flex-col items-end pt-4 space-y-1 pr-12">
                <div className="flex justify-between w-48 text-sm text-gray-600">
                  <span>Subtotal:</span>
                  <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(formData.subtotal)}</span>
                </div>
                <div className="flex justify-between w-48 text-sm text-gray-600">
                  <span>Tax:</span>
                  <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(formData.taxTotal)}</span>
                </div>
                <div className="flex justify-between w-48 text-base font-bold text-gray-900 border-t border-gray-300 pt-1">
                  <span>Total:</span>
                  <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(formData.total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="form-label">Notes</label>
          <textarea
            name="notes"
            id="notes"
            rows={3}
            value={formData.notes || ''}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/billing')}
            className="btn-secondary mr-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
          >
            <Save className="mr-2 h-5 w-5" />
            {isSubmitting ? 'Saving...' : 'Save as Draft'}
          </button>
        </div>
      </form>
    </div>
  );
}
