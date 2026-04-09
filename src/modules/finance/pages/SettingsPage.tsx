import React, { useState } from 'react';
import { Save, Plus, Edit2, Trash2, Building, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { INITIAL_SETTINGS } from '../constants';
import { AppSettings, Currency, LegalEntity } from '../types';
import { useApp } from '../context/AppContext';
import { useLang, t } from '../context/LanguageContext';
import { SlideOver } from '../components/ui/SlideOver';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { DataTable, Column } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';

export default function Settings() {
  const { settings: globalSettings, updateSettings, legalEntities, addLegalEntity, updateLegalEntity, deleteLegalEntity, loading: appLoading } = useApp();
  const { lang } = useLang();
  const [settings, setSettings] = useState<AppSettings>(globalSettings || INITIAL_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isEntitySlideOverOpen, setIsEntitySlideOverOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<LegalEntity | null>(null);
  const [entityForm, setEntityForm] = useState<Partial<LegalEntity>>({});
  const [isDeleteEntityDialogOpen, setIsDeleteEntityDialogOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<string | null>(null);

  React.useEffect(() => { if (globalSettings) setSettings(globalSettings); }, [globalSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: name.includes('Rate') || name.includes('Days') ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true); setMessage(null);
    try { await updateSettings(settings); setMessage({ type: 'success', text: t('\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0628\u0646\u062c\u0627\u062d', 'Settings saved successfully', lang) }); }
    catch { setMessage({ type: 'error', text: t('\u0641\u0634\u0644 \u062d\u0641\u0638 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a', 'Failed to save settings', lang) }); }
    finally { setIsSaving(false); }
  };

  const handleOpenEntitySlideOver = (entity?: LegalEntity) => {
    if (entity) { setEditingEntity(entity); setEntityForm(entity); }
    else { setEditingEntity(null); setEntityForm({ name: '', taxId: '', address: '', currency: Currency.USD, logoUrl: '' }); }
    setIsEntitySlideOverOpen(true);
  };

  const handleSaveEntity = async () => {
    if (!entityForm.name || !entityForm.taxId) return;
    try {
      if (editingEntity) await updateLegalEntity(editingEntity.id, entityForm);
      else await addLegalEntity(entityForm as any);
      setIsEntitySlideOverOpen(false);
    } catch (error) { console.error(error); }
  };

  const handleDeleteEntity = async () => {
    if (entityToDelete) { await deleteLegalEntity(entityToDelete); setIsDeleteEntityDialogOpen(false); setEntityToDelete(null); }
  };

  const entityColumns: Column<LegalEntity>[] = [
    { header: t('\u0627\u0644\u0627\u0633\u0645', 'Name', lang), key: 'name' },
    { header: t('\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0636\u0631\u064a\u0628\u064a', 'Tax ID', lang), key: 'taxId' },
    { header: t('\u0627\u0644\u0639\u0645\u0644\u0629', 'Currency', lang), key: 'currency' },
    { header: t('\u0627\u0644\u0639\u0646\u0648\u0627\u0646', 'Address', lang), key: 'address' },
    { header: t('\u0625\u062c\u0631\u0627\u0621\u0627\u062a', 'Actions', lang), key: 'id', align: 'right',
      render: (entity) => (
        <div className="flex space-x-2 justify-end">
          <button onClick={e => { e.stopPropagation(); handleOpenEntitySlideOver(entity); }} className="text-indigo-600 hover:text-indigo-900"><Edit2 size={18}/></button>
          <button onClick={e => { e.stopPropagation(); setEntityToDelete(entity.id); setIsDeleteEntityDialogOpen(true); }} className="text-red-600 hover:text-red-900"><Trash2 size={18}/></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a', 'Settings', lang)}</h1>

      {/* Platform Settings banner */}
      <Link to="/finance/global-settings" className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-5 py-4 hover:bg-emerald-100 transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0"><Globe size={20} className="text-white"/></div>
          <div>
            <p className="font-semibold text-emerald-800">{t('\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0639\u0627\u0645\u0629 \u0644\u0644\u0645\u0646\u0635\u0629', 'Platform Settings', lang)}</p>
            <p className="text-sm text-emerald-600 mt-0.5">{t('\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0643\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629 \u0648\u0627\u0644\u0634\u0639\u0627\u0631 \u0648\u0627\u0644\u0623\u0644\u0648\u0627\u0646 \u0648\u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0628\u0646\u0643\u064a\u0629 \u0627\u0644\u0645\u0634\u062a\u0631\u0643\u0629 \u0645\u0639 \u0648\u062d\u062f\u0629 \u0627\u0644\u0639\u0642\u0648\u062f', 'Manage company entities, logo, brand colors and bank details shared with Contracts', lang)}</p>
          </div>
        </div>
        <ArrowRight size={20} className="text-emerald-500 group-hover:translate-x-1 transition-transform"/>
      </Link>

      {/* Finance-specific settings (exchange rates, invoice config) */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {message && (
            <div className={`p-4 rounded-md ${message.type==='success'?'bg-green-50 text-green-800':'bg-red-50 text-red-800'}`}>{message.text}</div>
          )}
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><h3 className="text-lg font-medium leading-6 text-gray-900">{t('\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0639\u0627\u0645\u0629', 'General Configuration', lang)}</h3></div>
            <div>
              <label htmlFor="companyName" className="form-label">{t('\u0627\u0633\u0645 \u0627\u0644\u0634\u0631\u0643\u0629', 'Company Name', lang)}</label>
              <input type="text" name="companyName" id="companyName" value={settings.companyName} onChange={handleChange} className="form-input"/>
            </div>
            <div>
              <label htmlFor="defaultCurrency" className="form-label">{t('\u0627\u0644\u0639\u0645\u0644\u0629 \u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629', 'Default Currency', lang)}</label>
              <select name="defaultCurrency" id="defaultCurrency" value={settings.defaultCurrency} onChange={handleChange} className="form-input">
                {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="invoicePrefix" className="form-label">{t('\u0628\u0627\u062f\u0626\u0629 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629', 'Invoice Prefix', lang)}</label>
              <input type="text" name="invoicePrefix" id="invoicePrefix" value={settings.invoicePrefix} onChange={handleChange} className="form-input"/>
            </div>
            <div>
              <label htmlFor="defaultPaymentTermsDays" className="form-label">{t('\u0623\u064a\u0627\u0645 \u0634\u0631\u0648\u0637 \u0627\u0644\u062f\u0641\u0639 \u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629', 'Default Payment Terms (Days)', lang)}</label>
              <input type="number" name="defaultPaymentTermsDays" id="defaultPaymentTermsDays" value={settings.defaultPaymentTermsDays} onChange={handleChange} className="form-input"/>
            </div>
            <div className="sm:col-span-2 pt-6 border-t border-gray-200"><h3 className="text-lg font-medium leading-6 text-gray-900">{t('\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0635\u0631\u0641', 'Exchange Rates', lang)}</h3></div>
            <div>
              <label htmlFor="usdToSarRate" className="form-label">{t('\u0633\u0639\u0631 \u0627\u0644\u062f\u0648\u0644\u0627\u0631 \u0645\u0642\u0627\u0628\u0644 \u0627\u0644\u0631\u064a\u0627\u0644', 'USD to SAR Rate', lang)}</label>
              <input type="number" step="0.0001" name="usdToSarRate" id="usdToSarRate" value={settings.usdToSarRate} onChange={handleChange} className="form-input"/>
            </div>
            <div>
              <label htmlFor="sarToUsdRate" className="form-label">{t('\u0633\u0639\u0631 \u0627\u0644\u0631\u064a\u0627\u0644 \u0645\u0642\u0627\u0628\u0644 \u0627\u0644\u062f\u0648\u0644\u0627\u0631', 'SAR to USD Rate', lang)}</label>
              <input type="number" step="0.0001" name="sarToUsdRate" id="sarToUsdRate" value={settings.sarToUsdRate} onChange={handleChange} className="form-input"/>
            </div>
          </div>
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button type="submit" disabled={isSaving} className="btn-primary">
              <Save className={`${lang==='ar'?'ml-2':'mr-2'} h-5 w-5`}/>
              {isSaving ? t('\u062c\u0627\u0631\u064d \u0627\u0644\u062d\u0641\u0638...', 'Saving...', lang) : t('\u062d\u0641\u0638 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a', 'Save Settings', lang)}
            </button>
          </div>
        </form>
      </div>

      {/* Legal Entities */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium leading-6 text-gray-900">{t('\u0627\u0644\u0643\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629 \u0644\u0644\u0634\u0631\u0643\u0629', 'Company Legal Entities', lang)}</h3>
          <button onClick={() => handleOpenEntitySlideOver()} className="btn-primary inline-flex items-center px-3 py-2 text-sm leading-4">
            <Plus className={`${lang==='ar'?'ml-2':'-ml-0.5 mr-2'} h-4 w-4`}/>
            {t('\u0625\u0636\u0627\u0641\u0629 \u0643\u064a\u0627\u0646', 'Add Entity', lang)}
          </button>
        </div>
        {legalEntities.length === 0 ? (
          <EmptyState
            title={t('\u0644\u0627 \u062a\u0648\u062c\u062f \u0643\u064a\u0627\u0646\u0627\u062a \u0642\u0627\u0646\u0648\u0646\u064a\u0629', 'No Legal Entities', lang)}
            description={t('\u0623\u0636\u0641 \u0627\u0644\u0643\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629 \u0644\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0641\u0648\u062a\u0631\u0629.', "Add your company's legal entities to manage billing.", lang)}
            icon={Building}
            action={<button onClick={() => handleOpenEntitySlideOver()} className="btn-primary">{t('\u0625\u0636\u0627\u0641\u0629 \u0643\u064a\u0627\u0646', 'Add Entity', lang)}</button>}
          />
        ) : (
          <DataTable data={legalEntities} columns={entityColumns} keyField="id"/>
        )}
      </div>

      <SlideOver isOpen={isEntitySlideOverOpen} onClose={() => setIsEntitySlideOverOpen(false)} title={editingEntity ? t('\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0643\u064a\u0627\u0646 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a', 'Edit Legal Entity', lang) : t('\u0625\u0636\u0627\u0641\u0629 \u0643\u064a\u0627\u0646 \u0642\u0627\u0646\u0648\u0646\u064a', 'Add Legal Entity', lang)}>
        <div className="space-y-6">
          <div><label className="form-label">{t('\u0627\u0633\u0645 \u0627\u0644\u0643\u064a\u0627\u0646', 'Entity Name', lang)}</label><input type="text" required value={entityForm.name||''} onChange={e => setEntityForm({...entityForm, name: e.target.value})} className="form-input"/></div>
          <div><label className="form-label">{t('\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0636\u0631\u064a\u0628\u064a', 'Tax ID', lang)}</label><input type="text" required value={entityForm.taxId||''} onChange={e => setEntityForm({...entityForm, taxId: e.target.value})} className="form-input"/></div>
          <div><label className="form-label">{t('\u0627\u0644\u0639\u0645\u0644\u0629', 'Currency', lang)}</label><select value={entityForm.currency||Currency.USD} onChange={e => setEntityForm({...entityForm, currency: e.target.value as Currency})} className="form-input">{Object.values(Currency).map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="form-label">{t('\u0627\u0644\u0639\u0646\u0648\u0627\u0646', 'Address', lang)}</label><textarea rows={3} value={entityForm.address||''} onChange={e => setEntityForm({...entityForm, address: e.target.value})} className="form-input"/></div>
          <div><label className="form-label">{t('\u0631\u0627\u0628\u0637 \u0627\u0644\u0634\u0639\u0627\u0631 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)', 'Logo URL (Optional)', lang)}</label><input type="text" value={entityForm.logoUrl||''} onChange={e => setEntityForm({...entityForm, logoUrl: e.target.value})} className="form-input"/></div>
          <div className="pt-4"><button onClick={handleSaveEntity} className="btn-primary w-full justify-center">{t('\u062d\u0641\u0638 \u0627\u0644\u0643\u064a\u0627\u0646', 'Save Entity', lang)}</button></div>
        </div>
      </SlideOver>

      <ConfirmDialog
        isOpen={isDeleteEntityDialogOpen}
        onClose={() => setIsDeleteEntityDialogOpen(false)}
        onConfirm={handleDeleteEntity}
        title={t('\u062d\u0630\u0641 \u0627\u0644\u0643\u064a\u0627\u0646 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a', 'Delete Legal Entity', lang)}
        message={t('\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f \u0645\u0646 \u062d\u0630\u0641 \u0647\u0630\u0627 \u0627\u0644\u0643\u064a\u0627\u0646\u061f \u0644\u0627 \u064a\u0645\u0643\u0646 \u0627\u0644\u062a\u0631\u0627\u062c\u0639.', 'Are you sure you want to delete this legal entity? This action cannot be undone.', lang)}
      />
    </div>
  );
}
