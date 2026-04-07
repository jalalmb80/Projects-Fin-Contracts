import React, { useState } from 'react';
import { Save, Plus, Edit2, Trash2, Building } from 'lucide-react';
import { INITIAL_SETTINGS } from '../constants';
import { AppSettings, Currency, LegalEntity } from '../types';
import { useApp } from '../context/AppContext';
import { SlideOver } from '../components/ui/SlideOver';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { DataTable, Column } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';

export default function Settings() {
  const { 
    settings: globalSettings, 
    updateSettings, 
    legalEntities, 
    addLegalEntity, 
    updateLegalEntity, 
    deleteLegalEntity,
    loading: appLoading 
  } = useApp();

  // Settings State
  const [settings, setSettings] = useState<AppSettings>(globalSettings || INITIAL_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Legal Entity State
  const [isEntitySlideOverOpen, setIsEntitySlideOverOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<LegalEntity | null>(null);
  const [entityForm, setEntityForm] = useState<Partial<LegalEntity>>({});
  const [isDeleteEntityDialogOpen, setIsDeleteEntityDialogOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<string | null>(null);

  // Sync local settings with global settings when loaded
  React.useEffect(() => {
    if (globalSettings) {
      setSettings(globalSettings);
    }
  }, [globalSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: name.includes('Rate') || name.includes('Days') ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    
    try {
      await updateSettings(settings);
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  // Legal Entity Handlers
  const handleOpenEntitySlideOver = (entity?: LegalEntity) => {
    if (entity) {
      setEditingEntity(entity);
      setEntityForm(entity);
    } else {
      setEditingEntity(null);
      setEntityForm({
        name: '',
        taxId: '',
        address: '',
        currency: Currency.USD,
        logoUrl: ''
      });
    }
    setIsEntitySlideOverOpen(true);
  };

  const handleSaveEntity = async () => {
    if (!entityForm.name || !entityForm.taxId) return;

    try {
      if (editingEntity) {
        await updateLegalEntity(editingEntity.id, entityForm);
      } else {
        await addLegalEntity(entityForm as any);
      }
      setIsEntitySlideOverOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteEntity = async () => {
    if (entityToDelete) {
      await deleteLegalEntity(entityToDelete);
      setIsDeleteEntityDialogOpen(false);
      setEntityToDelete(null);
    }
  };

  const entityColumns: Column<LegalEntity>[] = [
    { header: 'Name', key: 'name' },
    { header: 'Tax ID', key: 'taxId' },
    { header: 'Currency', key: 'currency' },
    { header: 'Address', key: 'address' },
    { 
      header: 'Actions', 
      key: 'id', 
      align: 'right',
      render: (entity) => (
        <div className="flex space-x-2 justify-end">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEntitySlideOver(entity);
            }}
            className="text-indigo-600 hover:text-indigo-900"
          >
            <Edit2 size={18} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setEntityToDelete(entity.id);
              setIsDeleteEntityDialogOpen(true);
            }}
            className="text-red-600 hover:text-red-900"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* General Settings */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {message && (
            <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <h3 className="text-lg font-medium leading-6 text-gray-900">General Configuration</h3>
            </div>

            <div>
              <label htmlFor="companyName" className="form-label">Company Name</label>
              <input
                type="text"
                name="companyName"
                id="companyName"
                value={settings.companyName}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="defaultCurrency" className="form-label">Default Currency</label>
              <select
                name="defaultCurrency"
                id="defaultCurrency"
                value={settings.defaultCurrency}
                onChange={handleChange}
                className="form-input"
              >
                {Object.values(Currency).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="invoicePrefix" className="form-label">Invoice Prefix</label>
              <input
                type="text"
                name="invoicePrefix"
                id="invoicePrefix"
                value={settings.invoicePrefix}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="defaultPaymentTermsDays" className="form-label">Default Payment Terms (Days)</label>
              <input
                type="number"
                name="defaultPaymentTermsDays"
                id="defaultPaymentTermsDays"
                value={settings.defaultPaymentTermsDays}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="sm:col-span-2 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Exchange Rates</h3>
            </div>

            <div>
              <label htmlFor="usdToSarRate" className="form-label">USD to SAR Rate</label>
              <input
                type="number"
                step="0.0001"
                name="usdToSarRate"
                id="usdToSarRate"
                value={settings.usdToSarRate}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="sarToUsdRate" className="form-label">SAR to USD Rate</label>
              <input
                type="number"
                step="0.0001"
                name="sarToUsdRate"
                id="sarToUsdRate"
                value={settings.sarToUsdRate}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary"
            >
              <Save className="mr-2 h-5 w-5" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Legal Entities Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Company Legal Entities</h3>
          <button
            onClick={() => handleOpenEntitySlideOver()}
            className="btn-primary inline-flex items-center px-3 py-2 text-sm leading-4"
          >
            <Plus className="-ml-0.5 mr-2 h-4 w-4" />
            Add Entity
          </button>
        </div>
        
        {legalEntities.length === 0 ? (
          <EmptyState
            title="No Legal Entities"
            description="Add your company's legal entities to manage billing."
            icon={Building}
            action={
              <button
                onClick={() => handleOpenEntitySlideOver()}
                className="btn-primary"
              >
                Add Entity
              </button>
            }
          />
        ) : (
          <DataTable
            data={legalEntities}
            columns={entityColumns}
            keyField="id"
          />
        )}
      </div>

      {/* SlideOver for Legal Entity */}
      <SlideOver
        isOpen={isEntitySlideOverOpen}
        onClose={() => setIsEntitySlideOverOpen(false)}
        title={editingEntity ? "Edit Legal Entity" : "Add Legal Entity"}
      >
        <div className="space-y-6">
          <div>
            <label className="form-label">Entity Name</label>
            <input
              type="text"
              required
              value={entityForm.name || ''}
              onChange={(e) => setEntityForm({ ...entityForm, name: e.target.value })}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Tax ID</label>
            <input
              type="text"
              required
              value={entityForm.taxId || ''}
              onChange={(e) => setEntityForm({ ...entityForm, taxId: e.target.value })}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Currency</label>
            <select
              value={entityForm.currency || Currency.USD}
              onChange={(e) => setEntityForm({ ...entityForm, currency: e.target.value as Currency })}
              className="form-input"
            >
              {Object.values(Currency).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Address</label>
            <textarea
              rows={3}
              value={entityForm.address || ''}
              onChange={(e) => setEntityForm({ ...entityForm, address: e.target.value })}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Logo URL (Optional)</label>
            <input
              type="text"
              value={entityForm.logoUrl || ''}
              onChange={(e) => setEntityForm({ ...entityForm, logoUrl: e.target.value })}
              className="form-input"
            />
          </div>
          <div className="pt-4">
            <button
              onClick={handleSaveEntity}
              className="btn-primary w-full justify-center"
            >
              Save Entity
            </button>
          </div>
        </div>
      </SlideOver>

      <ConfirmDialog
        isOpen={isDeleteEntityDialogOpen}
        onClose={() => setIsDeleteEntityDialogOpen(false)}
        onConfirm={handleDeleteEntity}
        title="Delete Legal Entity"
        message="Are you sure you want to delete this legal entity? This action cannot be undone."
      />
    </div>
  );
}
