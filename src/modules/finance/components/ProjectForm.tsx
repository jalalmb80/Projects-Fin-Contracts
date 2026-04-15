import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, ContractType, Currency, WBSItem, Milestone, MilestoneStatus } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLang, t, tEnum } from '../context/LanguageContext';

interface ProjectFormProps {
  initialData?: Project;
  onSave: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export default function ProjectForm({ initialData, onSave, onCancel }: ProjectFormProps) {
  const { counterparties } = useApp();
  const { lang } = useLang();
  const isRTL = lang === 'ar';

  const [formData, setFormData] = useState<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '', description: '', clientId: '', contractType: ContractType.FIXED,
    contractValue: 0, baseCurrency: Currency.SAR,
    startDate: new Date().toISOString().split('T')[0],
    status: ProjectStatus.Planned, wbs: [], milestones: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'wbs' | 'milestones'>('details');

  useEffect(() => {
    if (!initialData && counterparties.length > 0 && !formData.clientId)
      setFormData(prev => ({ ...prev, clientId: counterparties[0].id }));
    if (initialData) {
      const { id, createdAt, updatedAt, ...rest } = initialData;
      setFormData(rest);
    }
  }, [initialData, counterparties]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await onSave(formData); }
    catch (error) { console.error('Error saving project:', error); }
    finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'contractValue' ? parseFloat(value) || 0 : value }));
  };

  const addWBSItem = () => setFormData(prev => ({ ...prev, wbs: [...prev.wbs, { id: crypto.randomUUID(), name: '', budget: 0, spent: 0, tags: [] }] }));
  const updateWBSItem = (id: string, field: keyof WBSItem, value: any) => setFormData(prev => ({ ...prev, wbs: prev.wbs.map(item => item.id === id ? { ...item, [field]: value } : item) }));
  const removeWBSItem = (id: string) => setFormData(prev => ({ ...prev, wbs: prev.wbs.filter(item => item.id !== id) }));

  const addMilestone = () => setFormData(prev => ({ ...prev, milestones: [...prev.milestones, { id: crypto.randomUUID(), projectId: '', name: '', description: '', dueDate: new Date().toISOString().split('T')[0], percentOfContract: 0, amount: 0, status: MilestoneStatus.Pending }] }));
  const updateMilestone = (id: string, field: keyof Milestone, value: any) => setFormData(prev => ({ ...prev, milestones: prev.milestones.map(item => { if (item.id !== id) return item; const updated = { ...item, [field]: value }; if (field === 'percentOfContract') updated.amount = (formData.contractValue * (value as number)) / 100; return updated; }) }));
  const removeMilestone = (id: string) => setFormData(prev => ({ ...prev, milestones: prev.milestones.filter(item => item.id !== id) }));

  const tabLabel = (tab: string) => {
    if (tab === 'details') return t('التفاصيل', 'Details', lang);
    if (tab === 'wbs') return 'WBS';
    return t('المراحل', 'Milestones', lang);
  };

  const inp = 'block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const lbl = 'block text-sm font-medium text-gray-700 mb-1';
  const btnSec = 'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none disabled:opacity-50';
  const btnPri = 'inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none disabled:opacity-50';

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {initialData ? t('تعديل المشروع', 'Edit Project', lang) : t('مشروع جديد', 'New Project', lang)}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-500"><X size={24} /></button>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex px-6 space-x-8 space-x-reverse">
            {(['details', 'wbs', 'milestones'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`${activeTab === tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                {tabLabel(tab)}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={lbl}>{t('اسم المشروع *', 'Project Name *', lang)}</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} className={inp} />
              </div>
              <div>
                <label className={lbl}>{t('العميل *', 'Client *', lang)}</label>
                <select name="clientId" required value={formData.clientId} onChange={handleChange} className={inp}>
                  <option value="">{t('اختر عميلاً', 'Select Client', lang)}</option>
                  {counterparties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>{t('الحالة', 'Status', lang)}</label>
                <select name="status" value={formData.status} onChange={handleChange} className={inp}>
                  {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{tEnum(s, lang)}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>{t('نوع العقد', 'Contract Type', lang)}</label>
                <select name="contractType" value={formData.contractType} onChange={handleChange} className={inp}>
                  {Object.values(ContractType).map(ct => <option key={ct} value={ct}>{tEnum(ct, lang)}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>{t('العملة', 'Currency', lang)}</label>
                <select name="baseCurrency" value={formData.baseCurrency} onChange={handleChange} className={inp}>
                  {Object.values(Currency).map(c => <option key={c} value={c}>{tEnum(c, lang)}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>{t('قيمة العقد', 'Contract Value', lang)}</label>
                <input type="number" name="contractValue" min="0" step="0.01" value={formData.contractValue} onChange={handleChange} className={inp} />
              </div>
              <div>
                <label className={lbl}>{t('تاريخ البداية', 'Start Date', lang)}</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className={inp} />
              </div>
              <div>
                <label className={lbl}>{t('تاريخ النهاية', 'End Date', lang)}</label>
                <input type="date" name="endDate" value={formData.endDate || ''} onChange={handleChange} className={inp} />
              </div>
              <div className="sm:col-span-2">
                <label className={lbl}>{t('الوصف', 'Description', lang)}</label>
                <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className={inp} />
              </div>
            </div>
          )}

          {activeTab === 'wbs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">{t('هيكل تفصيل العمل', 'Work Breakdown Structure', lang)}</h3>
                <button type="button" onClick={addWBSItem} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
                  <Plus className="h-4 w-4 ml-1" />{t('إضافة بند', 'Add Item', lang)}
                </button>
              </div>
              {formData.wbs.length === 0
                ? <p className="text-gray-500 text-sm italic">{t('لا توجد بنود حتى الآن.', 'No WBS items added yet.', lang)}</p>
                : <div className="space-y-3">{formData.wbs.map(item => (
                    <div key={item.id} className="flex items-start gap-3 bg-gray-50 p-3 rounded-md">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2"><input type="text" placeholder={t('اسم البند', 'Item Name', lang)} value={item.name} onChange={e => updateWBSItem(item.id, 'name', e.target.value)} className={inp} /></div>
                        <div><input type="number" placeholder={t('الميزانية', 'Budget', lang)} value={item.budget} onChange={e => updateWBSItem(item.id, 'budget', parseFloat(e.target.value) || 0)} className={inp} /></div>
                      </div>
                      <button type="button" onClick={() => removeWBSItem(item.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={18} /></button>
                    </div>
                  ))}</div>
              }
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">{t('المراحل', 'Milestones', lang)}</h3>
                <button type="button" onClick={addMilestone} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
                  <Plus className="h-4 w-4 ml-1" />{t('إضافة مرحلة', 'Add Milestone', lang)}
                </button>
              </div>
              {formData.milestones.length === 0
                ? <p className="text-gray-500 text-sm italic">{t('لا توجد مراحل حتى الآن.', 'No milestones added yet.', lang)}</p>
                : <div className="space-y-3">{formData.milestones.map(item => (
                    <div key={item.id} className="bg-gray-50 p-3 rounded-md space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input type="text" placeholder={t('اسم المرحلة', 'Milestone Name', lang)} value={item.name} onChange={e => updateMilestone(item.id, 'name', e.target.value)} className={inp} />
                          <input type="date" value={item.dueDate} onChange={e => updateMilestone(item.id, 'dueDate', e.target.value)} className={inp} />
                        </div>
                        <button type="button" onClick={() => removeMilestone(item.id)} className="mr-3 text-red-400 hover:text-red-600 p-1"><Trash2 size={18} /></button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500">{t('النسبة (%)', 'Percentage (%)', lang)}</label>
                          <input type="number" min="0" max="100" value={item.percentOfContract} onChange={e => updateMilestone(item.id, 'percentOfContract', parseFloat(e.target.value) || 0)} className={inp} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">{t('المبلغ', 'Amount', lang)}</label>
                          <input type="number" value={item.amount} onChange={e => updateMilestone(item.id, 'amount', parseFloat(e.target.value) || 0)} className={inp} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">{t('الحالة', 'Status', lang)}</label>
                          <select value={item.status} onChange={e => updateMilestone(item.id, 'status', e.target.value)} className={inp}>
                            {Object.values(MilestoneStatus).map(s => <option key={s} value={s}>{tEnum(s, lang)}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}</div>
              }
            </div>
          )}
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button type="button" onClick={onCancel} className={btnSec}>{t('إلغاء', 'Cancel', lang)}</button>
          <button onClick={handleSubmit} disabled={loading} className={btnPri}>
            {loading ? t('جارٍ الحفظ...', 'Saving...', lang) : t('حفظ المشروع', 'Save Project', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
