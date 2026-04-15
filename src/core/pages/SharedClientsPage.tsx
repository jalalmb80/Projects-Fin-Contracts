// =============================================================================
// src/core/pages/SharedClientsPage.tsx
//
// Platform-level client / counterparty directory.
// Route: /clients
// =============================================================================

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, AlertCircle, Users, Filter } from 'lucide-react';
import { useSharedClients } from '../hooks/useSharedClients';
import SharedClientForm from '../components/SharedClientForm';
import { SharedClient, SharedClientType } from '../types/sharedClient';

const TYPE_CONFIG: Record<SharedClientType, { label: string; cls: string }> = {
  CUSTOMER:     { label: 'عميل',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  VENDOR:       { label: 'مورّد',       cls: 'bg-blue-50   text-blue-700   border-blue-200'    },
  BOTH:         { label: 'عميل/مورّد', cls: 'bg-purple-50 text-purple-700 border-purple-200'  },
  INTERCOMPANY: { label: 'داخلي',      cls: 'bg-gray-100  text-gray-600  border-gray-200'    },
};

const STATUS_DOT: Record<string, string> = {
  active:   'bg-emerald-400',
  inactive: 'bg-gray-300',
  blocked:  'bg-red-400',
};

export default function SharedClientsPage() {
  const { clients, loading, addClient, updateClient, deleteClient } = useSharedClients();
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState<SharedClientType | ''>('');
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState<SharedClient | undefined>();
  const [confirmId,  setConfirmId]  = useState<string | null>(null);
  const [feedback,   setFeedback]   = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const flash = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const filtered = clients.filter(c => {
    const matchesSearch =
      c.name_ar.includes(search) ||
      (c.name_en ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email   ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.city    ?? '').includes(search);
    const matchesType = !typeFilter || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSave = async (data: Omit<SharedClient, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editing) {
        await updateClient(editing.id, data);
        flash('success', 'تم تحديث بيانات العميل بنجاح');
      } else {
        await addClient(data);
        flash('success', 'تمت إضافة العميل بنجاح');
      }
      setShowForm(false);
      setEditing(undefined);
    } catch {
      flash('error', 'حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirmId !== id) { setConfirmId(id); return; }
    setConfirmId(null);
    try { await deleteClient(id); flash('success', 'تم حذف العميل'); }
    catch   { flash('error', 'فشل الحذف'); }
  };

  const openEdit = (c: SharedClient) => { setEditing(c); setShowForm(true); };
  const openNew  = () => { setEditing(undefined); setShowForm(true); };

  return (
    <div className="space-y-5 p-6" dir="rtl">

      {confirmId && (() => {
        const c = clients.find(x => x.id === confirmId);
        return (
          <div className="flex items-center gap-4 bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-800">
            <AlertCircle size={18} className="shrink-0 text-red-600" />
            <span className="flex-1">
              هل تريد حذف <strong>{c?.name_ar}</strong>؟ لا يمكن التراجع. تأكد أنه ليس مرتبطاً بأي عقد أو فاتورة قبل الحذف.
            </span>
            <button onClick={() => handleDelete(confirmId)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg font-medium text-sm">حذف</button>
            <button onClick={() => setConfirmId(null)} className="text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg text-sm">إلغاء</button>
          </div>
        );
      })()}

      {feedback && (
        <div className={`px-4 py-3 rounded-xl text-sm border ${
          feedback.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>{feedback.msg}</div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">دليل العملاء</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            مصدر بيانات موحّد لوحدتي المالية والعقود وجميع الوحدات القادمة
            &nbsp;·&nbsp;
            <span className="font-medium text-gray-700">{clients.length}</span> سجل
          </p>
        </div>
        <button onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
          <Plus size={16} />إضافة عميل
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو البريد أو المدينة..."
            className="w-full pr-9 pl-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
        </div>
        <div className="relative">
          <Filter size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as SharedClientType | '')}
            className="pr-8 pl-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none appearance-none bg-white">
            <option value="">جميع الأنواع</option>
            <option value="CUSTOMER">عميل</option>
            <option value="VENDOR">مورّد</option>
            <option value="BOTH">عميل ومورّد</option>
            <option value="INTERCOMPANY">داخلي</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-100">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">جارٍ التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="mx-auto h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">
              {search || typeFilter ? 'لا توجد نتائج للبحث' : 'لا يوجد عملاء بعد'}
            </p>
            {!search && !typeFilter && (
              <button onClick={openNew} className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium">إضافة أول عميل</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-50">
              <thead className="bg-gray-50">
                <tr>
                  {['العميل', 'النوع', 'الكيان', 'التواصل', 'الوحدات', 'الحالة', 'إجراءات'].map(h => (
                    <th key={h} scope="col" className="px-5 py-3 text-right text-[11px] font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => {
                  const badge = TYPE_CONFIG[c.type] ?? TYPE_CONFIG.CUSTOMER;
                  const dot   = STATUS_DOT[c.status ?? 'active'] ?? STATUS_DOT.active;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xs font-medium text-emerald-700 shrink-0 select-none">
                            {c.name_ar[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{c.name_ar}</p>
                            {c.name_en && <p className="text-xs text-gray-400">{c.name_en}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">{c.entity_type ?? '—'}</td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700">{c.email || '—'}</p>
                        {c.phone && <p className="text-xs text-gray-400 mt-0.5" dir="ltr">{c.phone}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1 flex-wrap">
                          {(c.modules ?? []).map(m => (
                            <span key={m} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">{m}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${dot}`} />
                          <span className="text-xs text-gray-500">
                            {{ active: 'نشط', inactive: 'غير نشط', blocked: 'محظور' }[c.status ?? 'active']}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEdit(c)}
                            className="text-emerald-600 hover:text-emerald-800 p-1 rounded hover:bg-emerald-50">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => handleDelete(c.id)}
                            className={`p-1 rounded transition-colors ${
                              confirmId === c.id ? 'text-red-700 bg-red-50' : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                            }`}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <SharedClientForm
          initialData={editing}
          callingModule={editing ? undefined : 'cms'}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(undefined); }}
        />
      )}
    </div>
  );
}
