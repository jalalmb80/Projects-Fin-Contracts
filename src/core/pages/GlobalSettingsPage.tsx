import React, { useState, useRef } from 'react';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import { PlatformEntity, GlobalSettings } from '../types/globalSettings';
import {
  Save, Plus, Trash2, Star, Edit2, Check, X, Upload,
  Globe, Building2, CreditCard, Palette
} from 'lucide-react';

const EMPTY_ENTITY = (): PlatformEntity => ({
  id: Date.now().toString(),
  name: '',
  name_ar: '',
  taxId: '',
  cr_number: '',
  representative_name: '',
  representative_title: 'المدير العام',
  address: '',
  city: '',
  postal_code: '',
  po_box: '',
  phone: '',
  email: '',
  logo_url: '',
  logo_base64: undefined,
  primary_color: '#059669',
  secondary_color: '#f0fdf4',
  accent_color: '#064e3b',
  bank_iban: '',
  bank_name: '',
  account_holder: '',
  is_default: false,
  currency: 'SAR',
});

export default function GlobalSettingsPage() {
  const { globalSettings, updateGlobalSettings, globalSettingsLoading } = useGlobalSettings();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<PlatformEntity | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newEntity, setNewEntity] = useState<PlatformEntity>(EMPTY_ENTITY());
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeSection, setActiveSection] = useState<'entities' | 'general'>('general');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const newLogoInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, forNew: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (forNew) setNewEntity(prev => ({ ...prev, logo_base64: base64 }));
      else if (editData) setEditData(prev => prev ? { ...prev, logo_base64: base64 } : prev);
    };
    reader.readAsDataURL(file);
  };

  const saveEdit = async () => {
    if (!editData) return;
    setIsSaving(true);
    try {
      await updateGlobalSettings({
        ...globalSettings,
        entities: globalSettings.entities.map(e => e.id === editData.id ? editData : e),
      });
      setEditingId(null);
      setEditData(null);
      showFeedback('success', 'تم حفظ الكيان بنجاح / Entity saved successfully');
    } catch { showFeedback('error', 'فشل الحفظ / Save failed'); }
    finally { setIsSaving(false); }
  };

  const deleteEntity = async (id: string) => {
    if (globalSettings.entities.length === 1) return;
    const updated = globalSettings.entities.filter(e => e.id !== id);
    if (!updated.find(e => e.is_default)) updated[0].is_default = true;
    setIsSaving(true);
    try {
      await updateGlobalSettings({ ...globalSettings, entities: updated });
      showFeedback('success', 'تم الحذف / Deleted');
    } catch { showFeedback('error', 'فشل الحذف / Delete failed'); }
    finally { setIsSaving(false); }
  };

  const setDefault = async (id: string) => {
    await updateGlobalSettings({
      ...globalSettings,
      entities: globalSettings.entities.map(e => ({ ...e, is_default: e.id === id })),
    });
  };

  const addEntity = async () => {
    if (!newEntity.name_ar.trim() && !newEntity.name.trim()) return;
    const entity: PlatformEntity = { ...newEntity, id: Date.now().toString() };
    setIsSaving(true);
    try {
      await updateGlobalSettings({
        ...globalSettings,
        entities: [...globalSettings.entities, entity],
      });
      setIsAdding(false);
      setNewEntity(EMPTY_ENTITY());
      showFeedback('success', 'تمت الإضافة / Entity added');
    } catch { showFeedback('error', 'فشلت الإضافة / Add failed'); }
    finally { setIsSaving(false); }
  };

  const saveGeneral = async (updates: Partial<GlobalSettings>) => {
    setIsSaving(true);
    try {
      await updateGlobalSettings({ ...globalSettings, ...updates });
      showFeedback('success', 'تم حفظ الإعدادات / Settings saved');
    } catch { showFeedback('error', 'فشل الحفظ / Save failed'); }
    finally { setIsSaving(false); }
  };

  if (globalSettingsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inp = 'w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm';

  const EntityForm = ({ entity, onChange, onLogoUpload, logoRef }: {
    entity: PlatformEntity;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    logoRef: React.RefObject<HTMLInputElement>;
  }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
      <div className="sm:col-span-2 flex items-center gap-4">
        {entity.logo_base64 ? (
          <img src={entity.logo_base64} alt="logo" className="h-14 w-28 object-contain border border-slate-200 rounded-lg p-1 bg-white" />
        ) : (
          <div className="h-14 w-28 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-xs">Logo</div>
        )}
        <button type="button" onClick={() => logoRef.current?.click()} className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
          <Upload size={14} /> Upload Logo
        </button>
        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Name (English)</label>
        <input name="name" type="text" value={entity.name} onChange={onChange} className={inp} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">الاسم بالعربية</label>
        <input name="name_ar" dir="rtl" type="text" value={entity.name_ar} onChange={onChange} className={inp} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Tax ID / السجل التجاري</label>
        <input name="taxId" type="text" value={entity.taxId} onChange={onChange} className={inp} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">العملة / Currency</label>
        <select name="currency" value={entity.currency} onChange={onChange} className={inp}>
          {['SAR', 'USD', 'EUR', 'GBP', 'AED'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">الممثل / Representative</label>
        <input name="representative_name" type="text" value={entity.representative_name || ''} onChange={onChange} className={inp} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">الصفة / Title</label>
        <input name="representative_title" type="text" value={entity.representative_title || ''} onChange={onChange} className={inp} />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600 mb-1">العنوان / Address</label>
        <input name="address" type="text" value={entity.address} onChange={onChange} className={inp} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">المدينة / City</label>
        <input name="city" type="text" value={entity.city || ''} onChange={onChange} className={inp} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">الرمز البريدي / Postal Code</label>
        <input name="postal_code" type="text" value={entity.postal_code || ''} onChange={onChange} className={inp} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">الهاتف / Phone</label>
        <input name="phone" type="text" value={entity.phone || ''} onChange={onChange} className={inp} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">البريد الإلكتروني / Email</label>
        <input name="email" type="email" value={entity.email || ''} onChange={onChange} className={inp} />
      </div>
      <div className="sm:col-span-2 pt-3 border-t border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase mb-3">البيانات البنكية / Banking</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">اسم البنك / Bank Name</label>
        <input name="bank_name" type="text" value={entity.bank_name || ''} onChange={onChange} className={inp} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">اسم الحساب / Account Holder</label>
        <input name="account_holder" type="text" value={entity.account_holder || ''} onChange={onChange} className={inp} />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600 mb-1">رقم الآيبان / IBAN</label>
        <input name="bank_iban" dir="ltr" type="text" value={entity.bank_iban || ''} onChange={onChange} className={`${inp} font-mono`} />
      </div>
      <div className="sm:col-span-2 pt-3 border-t border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase mb-3">ألوان الهوية / Brand Colors</p>
        <div className="flex gap-6">
          {[{name:'primary_color',label:'Primary'},{name:'secondary_color',label:'Secondary'},{name:'accent_color',label:'Accent'}].map(({name,label})=>(
            <div key={name} className="flex items-center gap-2">
              <input name={name} type="color" value={(entity as any)[name]} onChange={onChange} className="w-8 h-8 rounded cursor-pointer border border-slate-200" />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const makeChangeHandler = (setter: React.Dispatch<React.SetStateAction<PlatformEntity>>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setter(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Globe size={26} className="text-emerald-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Platform Settings / الإعدادات العامة</h1>
          <p className="text-sm text-slate-500 mt-0.5">Shared across Finance and Contracts modules</p>
        </div>
      </div>

      {feedback && (
        <div className={`px-4 py-3 rounded-lg text-sm ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {feedback.text}
        </div>
      )}

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {([{id:'general',label:'General / عام',icon:Globe},{id:'entities',label:'Entities / الكيانات',icon:Building2}] as const).map(({id,label,icon:Icon})=>(
          <button key={id} onClick={()=>setActiveSection(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection===id?'bg-white text-emerald-700 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
            <Icon size={15}/> {label}
          </button>
        ))}
      </div>

      {activeSection==='general' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3">General Platform Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Default Language / اللغة الافتراضية</label>
              <select value={globalSettings.default_language} onChange={e=>saveGeneral({default_language:e.target.value as 'ar'|'en'})} className={inp}>
                <option value="ar">العربية / Arabic</option>
                <option value="en">English / الإنجليزية</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Default Currency / العملة الافتراضية</label>
              <select value={globalSettings.default_currency} onChange={e=>saveGeneral({default_currency:e.target.value})} className={inp}>
                {['SAR','USD','EUR','GBP','AED'].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-start gap-3 bg-slate-50 rounded-lg p-4">
            <Building2 size={16} className="text-slate-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500">
              <strong className="text-slate-700">Company Entities</strong> are managed in the Entities tab. Used as <em>Party One</em> in contracts and as <em>Legal Entities</em> in Finance billing.
            </p>
          </div>
          <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-4">
            <CreditCard size={16} className="text-slate-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500">
              <strong className="text-slate-700">Finance-specific:</strong> exchange rates, invoice prefix, payment terms remain in Finance → Settings.<br/>
              <strong className="text-slate-700">CMS-specific:</strong> VAT rate remains in Contracts → Settings.
            </p>
          </div>
        </div>
      )}

      {activeSection==='entities' && (
        <div className="space-y-4">
          {globalSettings.entities.map(entity=>(
            <div key={entity.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  {entity.logo_base64?(
                    <img src={entity.logo_base64} alt="" className="h-8 w-16 object-contain"/>
                  ):(
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{backgroundColor:entity.primary_color}}>
                      {(entity.name_ar||entity.name).charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{entity.name_ar||entity.name}</p>
                    <p className="text-xs text-slate-500">{entity.name} · {entity.taxId}</p>
                  </div>
                  {entity.is_default&&(<span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-medium px-2.5 py-0.5 rounded-full"><Star size={11} fill="currentColor"/> Default</span>)}
                </div>
                <div className="flex items-center gap-2">
                  {!entity.is_default&&(<button onClick={()=>setDefault(entity.id)} className="p-1.5 text-slate-400 hover:text-emerald-600"><Star size={16}/></button>)}
                  <button onClick={()=>{setEditingId(entity.id);setEditData({...entity});}} className="p-1.5 text-slate-400 hover:text-indigo-600"><Edit2 size={16}/></button>
                  {!entity.is_default&&(<button onClick={()=>deleteEntity(entity.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>)}
                </div>
              </div>
              {editingId===entity.id&&editData&&(
                <div className="p-5">
                  <EntityForm entity={editData} onChange={makeChangeHandler(setEditData as React.Dispatch<React.SetStateAction<PlatformEntity>>)} onLogoUpload={e=>handleLogoUpload(e,false)} logoRef={logoInputRef}/>
                  <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
                    <button onClick={()=>{setEditingId(null);setEditData(null);}} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"><X size={14} className="inline mr-1"/> Cancel</button>
                    <button onClick={saveEdit} disabled={isSaving} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                      <Check size={14}/> {isSaving?'Saving...':'Save Entity'}
                    </button>
                  </div>
                </div>
              )}
              {editingId!==entity.id&&(
                <div className="px-5 py-3 flex items-center gap-3">
                  {[entity.primary_color,entity.secondary_color,entity.accent_color].map((c,i)=>(
                    <div key={i} className="w-5 h-5 rounded-full border border-white shadow-sm" style={{backgroundColor:c}} title={c}/>
                  ))}
                  {entity.bank_name&&<span className="text-xs text-slate-400 ml-2">{entity.bank_name} · {entity.bank_iban?.slice(-4)?`****${entity.bank_iban.slice(-4)}`:''}</span>}
                  {entity.email&&<span className="text-xs text-slate-400">{entity.email}</span>}
                </div>
              )}
            </div>
          ))}
          {isAdding?(
            <div className="bg-white rounded-xl border border-emerald-300 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 text-sm mb-1">Add New Entity / إضافة كيان جديد</h3>
              <EntityForm entity={newEntity} onChange={makeChangeHandler(setNewEntity)} onLogoUpload={e=>handleLogoUpload(e,true)} logoRef={newLogoInputRef}/>
              <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
                <button onClick={()=>setIsAdding(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={addEntity} disabled={isSaving} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                  <Plus size={14}/> {isSaving?'Adding...':'Add Entity'}
                </button>
              </div>
            </div>
          ):(
            <button onClick={()=>{setNewEntity(EMPTY_ENTITY());setIsAdding(true);}} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors text-sm font-medium">
              <Plus size={18}/> Add Entity / إضافة كيان
            </button>
          )}
        </div>
      )}
    </div>
  );
}
