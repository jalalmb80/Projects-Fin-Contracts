import React, { useState } from 'react';
import { Contract } from '../types';
import { Plus, Search, FileText, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { useLang, t } from '../context/LanguageContext';
import { useContracts } from '../hooks/useContracts';

export default function ContractsList({ contracts, clients, onEdit, onCreate }: any) {
  const { lang } = useLang();
  const { deleteContract } = useContracts();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredContracts = contracts.filter((c: Contract) => {
    const matchesSearch = c.title_ar.includes(searchTerm) || c.contract_number?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'مسودة': return 'bg-amber-100 text-amber-700';
      case 'نشط': return 'bg-emerald-100 text-emerald-700';
      case 'قيد المراجعة': return 'bg-purple-100 text-purple-700';
      case 'موقّع': return 'bg-blue-100 text-blue-700';
      case 'مكتمل': return 'bg-slate-100 text-slate-700';
      case 'منتهي': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    await deleteContract(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  const getClientName = (clientId: string) => {
    const client = clients.find((c: any) => c.id === clientId);
    return client ? (client.name_ar || client.nameAr || client.name || '—') : '—';
  };

  const confirmTarget = confirmDeleteId
    ? contracts.find((c: Contract) => c.id === confirmDeleteId)
    : null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {confirmDeleteId && (
        <div className="flex items-center gap-4 bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-800" dir="rtl">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span className="flex-1">
            هل تريد حذف العقد <strong>{confirmTarget?.contract_number}</strong> — {confirmTarget?.title_ar}؟ لا يمكن التراجع عن هذا الإجراء.
          </span>
          <button onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg font-medium transition-colors">
            حذف
          </button>
          <button onClick={() => setConfirmDeleteId(null)} className="text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg font-medium transition-colors">
            إلغاء
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('إدارة العقود', 'Contract Management', lang)}</h1>
          <p className="text-slate-500 mt-1">{t('إدارة وتتبع جميع العقود', 'Manage and track all contracts', lang)}</p>
        </div>
        <button onClick={onCreate} className="flex items-center space-x-2 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus size={18} />
          <span>{t('عقد جديد', 'New Contract', lang)}</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder={t('بحث برقم العقد أو العنوان...', 'Search by contract number or title...', lang)}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white min-w-[200px]">
          <option value="all">{t('جميع الحالات', 'All Statuses', lang)}</option>
          <option value="مسودة">{t('مسودة', 'Draft', lang)}</option>
          <option value="قيد المراجعة">{t('قيد المراجعة', 'In Review', lang)}</option>
          <option value="موقّع">{t('موقّع', 'Signed', lang)}</option>
          <option value="نشط">{t('نشط', 'Active', lang)}</option>
          <option value="مكتمل">{t('مكتمل', 'Completed', lang)}</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredContracts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg">{t('لا توجد عقود', 'No contracts found', lang)}</p>
          </div>
        ) : (
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">{t('رقم العقد', 'Contract No.', lang)}</th>
                <th className="px-6 py-4 font-medium">{t('العنوان', 'Title', lang)}</th>
                <th className="px-6 py-4 font-medium">{t('العميل', 'Client', lang)}</th>
                <th className="px-6 py-4 font-medium">{t('الحالة', 'Status', lang)}</th>
                <th className="px-6 py-4 font-medium">{t('تاريخ البدء', 'Start Date', lang)}</th>
                <th className="px-6 py-4 font-medium text-left">{t('إجراءات', 'Actions', lang)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContracts.map((c: Contract) => (
                <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${confirmDeleteId === c.id ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{c.contract_number || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-900">{c.title_ar}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{getClientName(c.client_id)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>{c.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{c.start_date || '-'}</td>
                  <td className="px-6 py-4 text-left space-x-3 space-x-reverse">
                    <button onClick={() => onEdit(c.id)} className="text-emerald-600 hover:text-emerald-700">
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(confirmDeleteId === c.id ? null : c.id)}
                      className={`transition-colors ${confirmDeleteId === c.id ? 'text-red-700' : 'text-red-400 hover:text-red-600'}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
