import React, { useState, useRef } from 'react';
import { useLang, t } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { PartyOneEntity } from '../types';
import { Plus, Trash2, Star, Edit2, Check, X, Upload } from 'lucide-react';

const emptyEntity = (): PartyOneEntity => ({
  id: Date.now().toString(),
  name_ar: '',
  cr_number: '',
  representative_name: '',
  representative_title: 'المدير العام',
  address: '',
  city: '',
  postal_code: '',
  po_box: '',
  phone: '',
  email: '',
  logo_base64: undefined,
  primary_color: '#059669',
  secondary_color: '#f0fdf4',
  accent_color: '#064e3b',
  bank_iban: '',
  bank_name: 'بنك البلاد',
  account_holder: '',
  is_default: false,
});

export default function Settings() {
  const { lang } = useLang();
  const { settings, setSettings } = useSettings();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<PartyOneEntity | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newEntity, setNewEntity] = useState<PartyOneEntity>(emptyEntity());
  const logoInputRef = useRef<HTMLInputElement>(null);
  const newLogoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, forNew: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (forNew) {
        setNewEntity(prev => ({ ...prev, logo_base64: base64 }));
      } else if (editData) {
        setEditData(prev => prev ? { ...prev, logo_base64: base64 } : prev);
      }
    };
    reader.readAsDataURL(file);
  };

  const saveEdit = () => {
    if (!editData) return;
    setSettings({
      ...settings,
      entities: settings.entities.map(e => e.id === editData.id ? editData : e)
    });
    setEditingId(null);
    setEditData(null);
  };

  const deleteEntity = (id: string) => {
    if (settings.entities.length === 1) return;
    const updated = settings.entities.filter(e => e.id !== id);
    if (!updated.find(e => e.is_default)) updated[0].is_default = true;
    setSettings({ ...settings, entities: updated });
  };

  const setDefault = (id: string) => {
    setSettings({
      ...settings,
      entities: settings.entities.map(e => ({ ...e, is_default: e.id === id }))
    });
  };

  const addEntity = () => {
    if (!newEntity.name_ar.trim()) return;
    setSettings({
      ...settings,
      entities: [...settings.entities, { ...newEntity, id: Date.now().toString() }]
    });
    setNewEntity(emptyEntity());
    setIsAdding(false);
  };

  const EntityColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-28 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
        />
        <div className="w-10 h-10 rounded-lg border border-slate-200" style={{ backgroundColor: value }} />
      </div>
    </div>
  );

  const EntityForm = ({ data, onChange, onLogoRef, onLogoChange }: {
    data: PartyOneEntity;
    onChange: (d: PartyOneEntity) => void;
    onLogoRef: React.RefObject<HTMLInputElement>;
    onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div className="space-y-6">
      {/* Logo Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">الشعار (Logo)</label>
        <div className="flex items-center gap-4">
          {data.logo_base64 ? (
            <img src={data.logo_base64} alt="logo" className="h-16 w-32 object-contain border border-slate-200 rounded-lg p-1 bg-white" />
          ) : (
            <div className="h-16 w-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-xs">لا يوجد شعار</div>
          )}
          <div>
            <input ref={onLogoRef} type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
            <button
              type="button"
              onClick={() => onLogoRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
            >
              <Upload size={16} />
              رفع شعار
            </button>
            {data.logo_base64 && (
              <button type="button" onClick={() => onChange({ ...data, logo_base64: undefined })} className="mt-2 text-xs text-red-500 hover:text-red-700">
                حذف الشعار
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">اسم الجهة</label>
          <input type="text" dir="rtl" value={data.name_ar} onChange={e => onChange({ ...data, name_ar: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">رقم السجل التجاري</label>
          <input type="text" value={data.cr_number} onChange={e => onChange({ ...data, cr_number: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">اسم الممثل</label>
          <input type="text" dir="rtl" value={data.representative_name} onChange={e => onChange({ ...data, representative_name: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">المسمى الوظيفي</label>
          <input type="text" dir="rtl" value={data.representative_title} onChange={e => onChange({ ...data, representative_title: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">المدينة</label>
          <input type="text" dir="rtl" value={data.city} onChange={e => onChange({ ...data, city: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">العنوان</label>
          <input type="text" dir="rtl" value={data.address} onChange={e => onChange({ ...data, address: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">الهاتف</label>
          <input type="text" value={data.phone} onChange={e => onChange({ ...data, phone: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">البريد الإلكتروني</label>
          <input type="email" value={data.email} onChange={e => onChange({ ...data, email: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
      </div>

      {/* Brand Colors */}
      <div className="border-t border-slate-100 pt-4">
        <h4 className="font-bold text-slate-700 mb-4">🎨 ألوان الهوية (تُستخدم في المعاينة والطباعة)</h4>
        <div className="grid grid-cols-3 gap-6">
          <EntityColorPicker label="اللون الأساسي (الجداول والعناوين)" value={data.primary_color} onChange={v => onChange({ ...data, primary_color: v })} />
          <EntityColorPicker label="اللون الثانوي (خلفيات الخلايا)" value={data.secondary_color} onChange={v => onChange({ ...data, secondary_color: v })} />
          <EntityColorPicker label="لون التمييز (النصوص البارزة)" value={data.accent_color} onChange={v => onChange({ ...data, accent_color: v })} />
        </div>
        {/* Live Preview */}
        <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
          <div className="text-xs font-bold text-slate-500 px-3 py-2 bg-slate-50">معاينة الألوان في الجدول</div>
          <table className="w-full text-sm text-right">
            <thead>
              <tr style={{ backgroundColor: data.primary_color }}>
                <th className="px-4 py-2 font-medium text-white">المهمة</th>
                <th className="px-4 py-2 font-medium text-white">المدة</th>
                <th className="px-4 py-2 font-medium text-white">التكلفة</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: data.secondary_color }}>
                <td className="px-4 py-2" style={{ color: data.accent_color }}>تصميم الواجهات</td>
                <td className="px-4 py-2">30 يوم</td>
                <td className="px-4 py-2">20,000 ر.س</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-2" style={{ color: data.accent_color }}>تطوير التطبيق</td>
                <td className="px-4 py-2">90 يوم</td>
                <td className="px-4 py-2">60,000 ر.س</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bank Details */}
      <div className="border-t border-slate-100 pt-4">
        <h4 className="font-bold text-slate-700 mb-4">🏦 البيانات البنكية</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">اسم البنك</label>
            <input type="text" value={data.bank_name} onChange={e => onChange({ ...data, bank_name: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">اسم الحساب</label>
            <input type="text" value={data.account_holder} onChange={e => onChange({ ...data, account_holder: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">رقم الآيبان</label>
            <input type="text" dir="ltr" value={data.bank_iban} onChange={e => onChange({ ...data, bank_iban: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-left" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-8">{t('الإعدادات', 'Settings', lang)}</h1>

      {/* Entities Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">جهات الطرف الأول</h2>
          <button onClick={() => { setIsAdding(true); setNewEntity(emptyEntity()); }} className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg">
            <Plus size={16} />
            إضافة جهة جديدة
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {settings.entities.map(entity => (
            <div key={entity.id} className="p-6">
              {editingId === entity.id && editData ? (
                <div>
                  <EntityForm
                    data={editData}
                    onChange={setEditData}
                    onLogoRef={logoInputRef}
                    onLogoChange={e => handleLogoUpload(e, false)}
                  />
                  <div className="flex gap-3 mt-6">
                    <button onClick={saveEdit} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium">
                      <Check size={16} /> حفظ التعديلات
                    </button>
                    <button onClick={() => { setEditingId(null); setEditData(null); }} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-lg font-medium">
                      <X size={16} /> إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {entity.logo_base64 ? (
                      <img src={entity.logo_base64} alt="logo" className="h-12 w-24 object-contain border border-slate-200 rounded-lg p-1 bg-white" />
                    ) : (
                      <div className="h-12 w-24 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">لا يوجد شعار</div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800">{entity.name_ar}</p>
                        {entity.is_default && (
                          <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star size={10} /> الافتراضي
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{entity.representative_name} — {entity.city}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: entity.primary_color }} title="اللون الأساسي" />
                        <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: entity.secondary_color }} title="اللون الثانوي" />
                        <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: entity.accent_color }} title="لون التمييز" />
                        <span className="text-xs text-slate-400">ألوان الهوية</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!entity.is_default && (
                      <button onClick={() => setDefault(entity.id)} className="text-xs text-slate-500 hover:text-emerald-600 border border-slate-200 hover:border-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <Star size={14} /> تعيين كافتراضي
                      </button>
                    )}
                    <button onClick={() => { setEditingId(entity.id); setEditData({ ...entity }); }} className="text-slate-400 hover:text-slate-600 border border-slate-200 p-2 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    {settings.entities.length > 1 && (
                      <button onClick={() => deleteEntity(entity.id)} className="text-slate-400 hover:text-red-500 border border-slate-200 p-2 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isAdding && (
            <div className="p-6 bg-emerald-50/30 border-t-2 border-emerald-200">
              <h3 className="font-bold text-slate-700 mb-4">➕ إضافة جهة جديدة</h3>
              <EntityForm
                data={newEntity}
                onChange={setNewEntity}
                onLogoRef={newLogoInputRef}
                onLogoChange={e => handleLogoUpload(e, true)}
              />
              <div className="flex gap-3 mt-6">
                <button onClick={addEntity} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium">
                  <Plus size={16} /> إضافة الجهة
                </button>
                <button onClick={() => setIsAdding(false)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-lg font-medium">
                  <X size={16} /> إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contract Defaults */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">{t('إعدادات العقود', 'Contract Settings', lang)}</h2>
        </div>
        <div className="p-6 grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('نسبة ضريبة القيمة المضافة الافتراضية (%)', 'Default VAT Rate (%)', lang)}</label>
            <input
              type="number"
              value={settings.default_vat_rate}
              onChange={e => setSettings({ ...settings, default_vat_rate: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <p className="text-sm text-emerald-600 font-medium">✅ جميع التغييرات تُحفظ تلقائياً</p>
        </div>
      </div>
    </div>
  );
}
