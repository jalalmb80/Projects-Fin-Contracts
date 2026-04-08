import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../core/firebase';
import { Save, Upload } from 'lucide-react';

export default function CMSSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [settings, setSettings] = useState({
    companyName: '',
    logoUrl: '',
    defaultCurrency: 'SAR',
    signatureText: '',
    signatureImageUrl: ''
  });

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'cms_settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as typeof settings);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'cms_settings', 'general'), settings);
      showFeedback('success', 'تم حفظ الإعدادات بنجاح (Settings saved successfully)');
    } catch (error) {
      console.error('Error saving settings:', error);
      showFeedback('error', 'حدث خطأ أثناء حفظ الإعدادات (Error saving settings)');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'signatureImageUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings({ ...settings, [field]: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">جاري التحميل... (Loading...)</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-slate-800">الإعدادات (Settings)</h1>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center space-x-2 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          <span>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات (Save Changes)'}</span>
        </button>
      </div>

      {feedback && (
        <div className={`px-4 py-2 rounded-lg text-sm mb-6 ${
          feedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {feedback.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 space-y-8">

          {/* General Settings */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">إعدادات الشركة (Company Settings)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">اسم الشركة (Company Name)</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={e => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="أدخل اسم الشركة"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">العملة الافتراضية (Default Currency)</label>
                <select
                  value={settings.defaultCurrency}
                  onChange={e => setSettings({ ...settings, defaultCurrency: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="EUR">يورو (EUR)</option>
                  <option value="AED">درهم إماراتي (AED)</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">شعار الشركة (Company Logo)</label>
                <div className="flex items-center space-x-4 space-x-reverse">
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="h-16 object-contain bg-slate-50 rounded border border-slate-200 p-1" />
                  ) : (
                    <div className="h-16 w-32 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-slate-400 text-sm">
                      لا يوجد شعار
                    </div>
                  )}
                  <label className="cursor-pointer flex items-center space-x-2 space-x-reverse px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
                    <Upload size={16} />
                    <span>رفع شعار جديد (Upload Logo)</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, 'logoUrl')} />
                  </label>
                  {settings.logoUrl && (
                    <button type="button" onClick={() => setSettings({ ...settings, logoUrl: '' })} className="text-red-500 hover:text-red-600 text-sm">
                      إزالة (Remove)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Signature Settings */}
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">إعدادات التوقيع (Signature Settings)</h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">نص التوقيع (Signature Text)</label>
                <textarea
                  rows={3}
                  value={settings.signatureText}
                  onChange={e => setSettings({ ...settings, signatureText: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="مثال: المدير العام / فلان الفلاني"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">صورة التوقيع (Signature Image)</label>
                <div className="flex items-center space-x-4 space-x-reverse">
                  {settings.signatureImageUrl ? (
                    <img src={settings.signatureImageUrl} alt="Signature" className="h-16 object-contain bg-slate-50 rounded border border-slate-200 p-1" />
                  ) : (
                    <div className="h-16 w-32 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-slate-400 text-sm">
                      لا يوجد توقيع
                    </div>
                  )}
                  <label className="cursor-pointer flex items-center space-x-2 space-x-reverse px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
                    <Upload size={16} />
                    <span>رفع توقيع جديد (Upload Signature)</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, 'signatureImageUrl')} />
                  </label>
                  {settings.signatureImageUrl && (
                    <button type="button" onClick={() => setSettings({ ...settings, signatureImageUrl: '' })} className="text-red-500 hover:text-red-600 text-sm">
                      إزالة (Remove)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
