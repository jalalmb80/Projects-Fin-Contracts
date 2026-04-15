// =============================================================================
// src/core/components/SharedClientForm.tsx
//
// Reusable 4-tab RTL form for creating / editing a SharedClient.
// =============================================================================

import React, { useState, useEffect } from 'react';
import { X, Building2, Phone, Banknote, Tag } from 'lucide-react';
import {
  SharedClient,
  SharedClientType,
  SharedClientEntityType,
  SharedClientStatus,
} from '../types/sharedClient';

type Tab = 'identity' | 'contact' | 'financial' | 'meta';

const TABS: { id: Tab; labelAr: string; icon: React.ReactNode }[] = [
  { id: 'identity',  labelAr: 'الهوية',           icon: <Building2 size={14} /> },
  { id: 'contact',   labelAr: 'التواصل',          icon: <Phone size={14} /> },
  { id: 'financial', labelAr: 'المالية',          icon: <Banknote size={14} /> },
  { id: 'meta',      labelAr: 'بيانات إضافية',   icon: <Tag size={14} /> },
];

type FormData = Omit<SharedClient, 'id' | 'created_at' | 'updated_at'>;

const EMPTY: FormData = {
  name_ar:              '',
  name_en:              '',
  type:                 'CUSTOMER',
  entity_type:          'شركة',
  tax_id:               '',
  license_authority:    '',
  license_no:           '',
  national_id:          '',
  representative_name:  '',
  representative_title: '',
  email:                '',
  phone:                '',
  address:              '',
  city:                 '',
  postal_code:          '',
  po_box:               '',
  currency:             'SAR',
  payment_terms_days:   30,
  credit_limit:         0,
  notes:                '',
  tags:                 [],
  modules:              [],
  status:               'active',
};

interface Props {
  initialData?:   SharedClient;
  callingModule?: string;
  onSave:   (data: FormData) => Promise<void>;
  onCancel: () => void;
}

export default function SharedClientForm({ initialData, callingModule, onSave, onCancel }: Props) {
  const [tab,      setTab]      = useState<Tab>('identity');
  const [form,     setForm]     = useState<FormData>(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      const { id, created_at, updated_at, ...rest } = initialData;
      setForm({ ...EMPTY, ...rest });
    } else if (callingModule) {
      setForm(prev => ({ ...prev, modules: [callingModule] }));
    }
  }, [initialData, callingModule]);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name_ar.trim()) e.name_ar = 'الاسم العربي مطلوب';
    setErrors(e);
    if (Object.keys(e).length > 0) setTab('identity');
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try { await onSave(form); }
    catch (err) { console.error('[SharedClientForm] save error', err); }
    finally { setSaving(false); }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !(form.tags ?? []).includes(t)) set('tags', [...(form.tags ?? []), t]);
    setTagInput('');
  };

  const removeTag = (t: string) => set('tags', (form.tags ?? []).filter(x => x !== t));

  const toggleModule = (m: string) => {
    const mods = form.modules ?? [];
    set('modules', mods.includes(m) ? mods.filter(x => x !== m) : [...mods, m]);
  };

  const inp = (err?: string) =>
    `block w-full rounded-lg border ${err ? 'border-red-400' : 'border-gray-200'} bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-400`;
  const lbl = 'block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wide';
  const sec = 'text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-3';
  const initials = form.name_ar ? form.name_ar.trim()[0] : '?';

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-sm font-medium text-emerald-700 shrink-0 select-none">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate text-sm">{form.name_ar || 'عميل جديد'}</p>
            <div className="flex gap-1 mt-0.5 flex-wrap">
              {(form.modules ?? []).map(m => (
                <span key={m} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{m}</span>
              ))}
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50">
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-gray-100 px-2 shrink-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors border-b-2 -mb-px ${
                tab === t.id ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {t.icon}{t.labelAr}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">

          {tab === 'identity' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>اسم الجهة (عربي) *</label>
                  <input className={inp(errors.name_ar)} value={form.name_ar}
                    onChange={e => { set('name_ar', e.target.value); setErrors(p => ({ ...p, name_ar: '' })); }}
                    placeholder="شركة الأفق للتقنية" />
                  {errors.name_ar && <p className="text-xs text-red-500 mt-1">{errors.name_ar}</p>}
                </div>
                <div>
                  <label className={lbl}>اسم الجهة (إنجليزي)</label>
                  <input className={inp()} value={form.name_en ?? ''} onChange={e => set('name_en', e.target.value)} placeholder="Horizon Tech Co." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>نوع الطرف *</label>
                  <select className={inp()} value={form.type} onChange={e => set('type', e.target.value as SharedClientType)}>
                    <option value="CUSTOMER">عميل (Customer)</option>
                    <option value="VENDOR">مورّد (Vendor)</option>
                    <option value="BOTH">عميل ومورّد</option>
                    <option value="INTERCOMPANY">داخلي (Intercompany)</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>نوع الكيان القانوني</label>
                  <select className={inp()} value={form.entity_type ?? ''} onChange={e => set('entity_type', e.target.value as SharedClientEntityType)}>
                    <option value="شركة">شركة</option>
                    <option value="جمعية">جمعية</option>
                    <option value="جهة حكومية">جهة حكومية</option>
                    <option value="فرد">فرد</option>
                  </select>
                </div>
              </div>
              <hr className="border-gray-100" />
              <p className={sec}>التسجيل والترخيص</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>الرقم الضريبي</label>
                  <input className={inp()} value={form.tax_id ?? ''} onChange={e => set('tax_id', e.target.value)} placeholder="300XXXXXXXXX" />
                </div>
                <div>
                  <label className={lbl}>جهة الترخيص</label>
                  <input className={inp()} value={form.license_authority ?? ''} onChange={e => set('license_authority', e.target.value)} placeholder="وزارة التجارة" />
                </div>
                <div>
                  <label className={lbl}>رقم الترخيص / س.ت</label>
                  <input className={inp()} value={form.license_no ?? ''} onChange={e => set('license_no', e.target.value)} placeholder="1234567890" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>رقم الهوية الوطنية / الإقامة</label>
                  <input className={inp()} value={form.national_id ?? ''} onChange={e => set('national_id', e.target.value)} placeholder="10XXXXXXXXX" />
                </div>
              </div>
            </div>
          )}

          {tab === 'contact' && (
            <div className="space-y-4">
              <p className={sec}>الممثل الرسمي</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>اسم الممثل</label>
                  <input className={inp()} value={form.representative_name ?? ''} onChange={e => set('representative_name', e.target.value)} placeholder="محمد عبدالله" />
                </div>
                <div>
                  <label className={lbl}>صفة الممثل</label>
                  <input className={inp()} value={form.representative_title ?? ''} onChange={e => set('representative_title', e.target.value)} placeholder="المدير التنفيذي" />
                </div>
              </div>
              <hr className="border-gray-100" />
              <p className={sec}>بيانات التواصل</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>البريد الإلكتروني</label>
                  <input className={inp()} type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="info@example.com" />
                </div>
                <div>
                  <label className={lbl}>رقم الهاتف</label>
                  <input className={inp()} value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="+966 5X XXX XXXX" />
                </div>
              </div>
              <hr className="border-gray-100" />
              <p className={sec}>العنوان</p>
              <div>
                <label className={lbl}>العنوان التفصيلي</label>
                <input className={inp()} value={form.address ?? ''} onChange={e => set('address', e.target.value)} placeholder="شارع الملك فهد، حي العليا" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>المدينة</label>
                  <input className={inp()} value={form.city ?? ''} onChange={e => set('city', e.target.value)} placeholder="الرياض" />
                </div>
                <div>
                  <label className={lbl}>الرمز البريدي</label>
                  <input className={inp()} value={form.postal_code ?? ''} onChange={e => set('postal_code', e.target.value)} placeholder="12345" />
                </div>
                <div>
                  <label className={lbl}>ص.ب</label>
                  <input className={inp()} value={form.po_box ?? ''} onChange={e => set('po_box', e.target.value)} placeholder="12345" />
                </div>
              </div>
            </div>
          )}

          {tab === 'financial' && (
            <div className="space-y-4">
              <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                هذه الحقول تُستخدم أساساً في وحدة المالية. وحدة العقود تقرأ منها فقط.
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>العملة الافتراضية</label>
                  <select className={inp()} value={form.currency ?? 'SAR'} onChange={e => set('currency', e.target.value)}>
                    <option value="SAR">ر.س (SAR)</option>
                    <option value="USD">دولار (USD)</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>أيام شروط الدفع</label>
                  <input className={inp()} type="number" min={0} value={form.payment_terms_days ?? 30}
                    onChange={e => set('payment_terms_days', parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className={lbl}>حد الائتمان</label>
                  <input className={inp()} type="number" min={0} value={form.credit_limit ?? 0}
                    onChange={e => set('credit_limit', parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <div>
                <label className={lbl}>ملاحظات داخلية</label>
                <input className={inp()} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} placeholder="تفضيلات خاصة، تنبيهات، إلخ" />
              </div>
            </div>
          )}

          {tab === 'meta' && (
            <div className="space-y-4">
              <p className={sec}>الوسوم</p>
              <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-lg min-h-[40px] cursor-text"
                onClick={() => document.getElementById('tag-input')?.focus()}>
                {(form.tags ?? []).map(t => (
                  <span key={t} className="flex items-center gap-1 text-xs bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full">
                    {t}
                    <button type="button" onClick={() => removeTag(t)} className="opacity-50 hover:opacity-100 leading-none">×</button>
                  </span>
                ))}
                <input id="tag-input" className="border-none outline-none bg-transparent text-sm min-w-[80px] text-gray-700 flex-1"
                  value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
                    if (e.key === 'Backspace' && !tagInput && (form.tags ?? []).length > 0)
                      set('tags', (form.tags ?? []).slice(0, -1));
                  }}
                  placeholder="أضف وسماً ثم Enter..." />
              </div>
              <hr className="border-gray-100" />
              <p className={sec}>الوحدات المستخدِمة</p>
              <p className="text-xs text-gray-400 -mt-2">سيظهر هذا العميل في قوائم الاختيار في كل وحدة محددة أدناه</p>
              <div className="flex flex-wrap gap-2">
                {['finance', 'cms', 'hr', 'crm'].map(m => {
                  const on = (form.modules ?? []).includes(m);
                  return (
                    <button key={m} type="button" onClick={() => toggleModule(m)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors font-medium ${
                        on ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}>
                      {m}
                    </button>
                  );
                })}
              </div>
              <hr className="border-gray-100" />
              <div>
                <label className={lbl}>الحالة</label>
                <select className={inp()} value={form.status ?? 'active'} onChange={e => set('status', e.target.value as SharedClientStatus)}>
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                  <option value="blocked">محظور</option>
                </select>
              </div>
              {initialData && (
                <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 space-y-1 border border-gray-100">
                  <div>تاريخ الإنشاء: <span className="text-gray-600">{initialData.created_at?.slice(0, 10)}</span></div>
                  <div>آخر تحديث: <span className="text-gray-600">{initialData.updated_at?.slice(0, 10)}</span></div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100">
            إلغاء
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="px-5 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-60 font-medium">
            {saving ? 'جارٍ...' : initialData ? 'حفظ التعديلات' : 'إضافة عميل'}
          </button>
        </div>
      </div>
    </div>
  );
}
