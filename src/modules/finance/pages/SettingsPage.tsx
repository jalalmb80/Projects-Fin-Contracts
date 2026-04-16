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

export default function SettingsPage() {
  const { settings: globalSettings, updateSettings, legalEntities, addLegalEntity, updateLegalEntity, deleteLegalEntity } = useApp();
  const { lang } = useLang();
  const [settings, setSettings] = useState<AppSettings>(globalSettings || INITIAL_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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
    try {
      await updateSettings(settings);
      setMessage({ type: 'success', text: t('تم حفظ الإعدادات بنجاح', 'Settings saved successfully', lang) });
    } catch {
      setMessage({ type: 'error', text: t('فشل حفظ الإعدادات', 'Failed to save settings', lang) });
    } finally { setIsSaving(false); }
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
    } catch (err) { console.error(err); }
  };

  const handleDeleteEntity = async () => {
    if (entityToDelete) { await deleteLegalEntity(entityToDelete); setIsDeleteEntityDialogOpen(false); setEntityToDelete(null); }
  };

  const btnPrimary = 'inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50';
  const formInput = 'block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50';
  const formLabel = 'block text-sm font-medium text-gray-700 mb-1';

  const entityColumns: Column<LegalEntity>[] = [
    { header: t('الاسم', 'Name', lang),               key: 'name' },
    { header: t('الرقم الضريبي', 'Tax ID', lang),      key: 'taxId' },
    { header: t('العملة', 'Currency', lang),           key: 'currency' },
    { header: t('العنوان', 'Address', lang),           key: 'address' },
    { header: t('إجراءات', 'Actions', lang), key: 'id', align: 'right',
      render: entity => (
        <div className="flex space-x-2 justify-end">
          <button onClick={e => { e.stopPropagation(); handleOpenEntitySlideOver(entity); }} className="text-indigo-600 hover:text-indigo-900"><Edit2 size={18} /></button>
          <button onClick={e => { e.stopPropagation(); setEntityToDelete(entity.id); setIsDeleteEntityDialogOpen(true); }} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('الإعدادات', 'Settings', lang)}</h1>

      {/* ── Platform Settings banner — links to /settings in the platform shell ── */}
      <Link to="/settings"
        className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-5 py-4 hover:bg-emerald-100 transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0"><Globe size={20} className="text-white" /></div>
          <div>
            <p className="font-semibold text-emerald-800">{t('إعدادات المنصة', 'Platform Settings', lang)}</p>
            <p className="text-sm text-emerald-600 mt-0.5">{t(
              'إدارة الكيانات القانونية والشعار والألوان والبيانات البنكية المشتركة مع وحدة العقود',
              'Manage entities, logo, brand colors and bank details shared with Contracts',
              lang
            )}</p>
          </div>
        </div>
        <ArrowRight size={20} className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* ── Finance-specific config ── */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {message && (
            <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message.text}
            </div>
          )}
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <h3 className="text-lg font-medium leading-6 text-gray-900">{t('الإعدادات العامة', 'General Configuration', lang)}</h3>
            </div>
            <div>
              <label htmlFor="companyName" className={formLabel}>{t('اسم الشركة', 'Company Name', lang)}</label>
              <input type="text" name="companyName" id="companyName" value={settings.companyName} onChange={handleChange} className={formInput} />
            </div>
            <div>
              <label htmlFor="defaultCurrency" className={formLabel}>{t('العملة الافتراضية', 'Default Currency', lang)}</label>
              <select name="defaultCurrency" id="defaultCurrency" value={settings.defaultCurrency} onChange={handleChange} className={formInput}>
                {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="invoicePrefix" className={formLabel}>{t('بادئة الفاتورة', 'Invoice Prefix', lang)}</label>
              <input type="text" name="invoicePrefix" id="invoicePrefix" value={settings.invoicePrefix} onChange={handleChange} className={formInput} />
            </div>
            <div>
              <label htmlFor="defaultPaymentTermsDays" className={formLabel}>{t('أيام شروط الدفع الافتراضية', 'Default Payment Terms (Days)', lang)}</label>
              <input type="number" name="defaultPaymentTermsDays" id="defaultPaymentTermsDays" value={settings.defaultPaymentTermsDays} onChange={handleChange} className={formInput} />
            </div>
            <div className="sm:col-span-2 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">{t('أسعار الصرف', 'Exchange Rates', lang)}</h3>
            </div>
            <div>
              <label htmlFor="usdToSarRate" className={formLabel}>{t('سعر الدولار مقابل الريال', 'USD to SAR Rate', lang)}</label>
              <input type="number" step="0.0001" name="usdToSarRate" id="usdToSarRate" value={settings.usdToSarRate} onChange={handleChange} className={formInput} />
            </div>
            <div>
              <label htmlFor="sarToUsdRate" className={formLabel}>{t('سعر الريال مقابل الدولار', 'SAR to USD Rate', lang)}</label>
              <input type="number" step="0.0001" name="sarToUsdRate" id="sarToUsdRate" value={settings.sarToUsdRate} onChange={handleChange} className={formInput} />
            </div>
          </div>
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button type="submit" disabled={isSaving} className={btnPrimary}>
              <Save className={`${lang === 'ar' ? 'ml-2' : 'mr-2'} h-5 w-5`} />
              {isSaving ? t('جارٍ الحفظ...', 'Saving...', lang) : t('حفظ الإعدادات', 'Save Settings', lang)}
            </button>
          </div>
        </form>
      </div>

      {/* ── Finance Legal Entities ── */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium leading-6 text-gray-900">{t('الكيانات القانونية للشركة', 'Company Legal Entities', lang)}</h3>
          <button onClick={() => handleOpenEntitySlideOver()} className={btnPrimary + ' px-3 py-2 text-sm leading-4'}>
            <Plus className={`${lang === 'ar' ? 'ml-2' : '-ml-0.5 mr-2'} h-4 w-4`} />
            {t('إضافة كيان', 'Add Entity', lang)}
          </button>
        </div>
        {legalEntities.length === 0 ? (
          <EmptyState
            title={t('لا توجد كيانات قانونية', 'No Legal Entities', lang)}
            description={t('أضف الكيانات القانونية لإدارة الفوترة.', "Add your company's legal entities to manage billing.", lang)}
            icon={Building}
            action={
              <button onClick={() => handleOpenEntitySlideOver()} className={btnPrimary}>
                {t('إضافة كيان', 'Add Entity', lang)}
              </button>
            }
          />
        ) : (
          <DataTable data={legalEntities} columns={entityColumns} keyField="id" />
        )}
      </div>

      <SlideOver
        isOpen={isEntitySlideOverOpen}
        onClose={() => setIsEntitySlideOverOpen(false)}
        title={editingEntity ? t('تعديل الكيان القانوني', 'Edit Legal Entity', lang) : t('إضافة كيان قانوني', 'Add Legal Entity', lang)}
      >
        <div className="space-y-6">
          <div>
            <label className={formLabel}>{t('اسم الكيان', 'Entity Name', lang)}</label>
            <input type="text" required value={entityForm.name || ''} onChange={e => setEntityForm({ ...entityForm, name: e.target.value })} className={formInput} />
          </div>
          <div>
            <label className={formLabel}>{t('الرقم الضريبي', 'Tax ID', lang)}</label>
            <input type="text" required value={entityForm.taxId || ''} onChange={e => setEntityForm({ ...entityForm, taxId: e.target.value })} className={formInput} />
          </div>
          <div>
            <label className={formLabel}>{t('العملة', 'Currency', lang)}</label>
            <select value={entityForm.currency || Currency.USD} onChange={e => setEntityForm({ ...entityForm, currency: e.target.value as Currency })} className={formInput}>
              {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={formLabel}>{t('العنوان', 'Address', lang)}</label>
            <textarea rows={3} value={entityForm.address || ''} onChange={e => setEntityForm({ ...entityForm, address: e.target.value })} className={formInput} />
          </div>
          <div>
            <label className={formLabel}>{t('رابط الشعار (اختياري)', 'Logo URL (Optional)', lang)}</label>
            <input type="text" value={entityForm.logoUrl || ''} onChange={e => setEntityForm({ ...entityForm, logoUrl: e.target.value })} className={formInput} />
          </div>
          <div className="pt-4">
            <button onClick={handleSaveEntity} className={btnPrimary + ' w-full justify-center'}>
              {t('حفظ الكيان', 'Save Entity', lang)}
            </button>
          </div>
        </div>
      </SlideOver>

      <ConfirmDialog
        isOpen={isDeleteEntityDialogOpen}
        onClose={() => setIsDeleteEntityDialogOpen(false)}
        onConfirm={handleDeleteEntity}
        title={t('حذف الكيان القانوني', 'Delete Legal Entity', lang)}
        message={t('هل أنت متأكد من حذف هذا الكيان؟ لا يمكن التراجع.', 'Are you sure you want to delete this legal entity? Cannot be undone.', lang)}
      />
    </div>
  );
}
