import React from 'react';
import { Contract } from '../types';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useLang, t } from '../context/LanguageContext';
import { toHijri } from '../utils/hijriDate';

export default function Dashboard({ contracts, onEdit }: { contracts: Contract[], onEdit: (id: string) => void }) {
  const { lang } = useLang();
  
  const stats = [
    { label_ar: 'إجمالي العقود', label_en: 'Total Contracts', value: contracts.length, icon: FileText, color: 'bg-blue-500' },
    { label_ar: 'مسودات', label_en: 'Drafts', value: contracts.filter(c => c.status === 'مسودة').length, icon: Clock, color: 'bg-amber-500' },
    { label_ar: 'نشطة', label_en: 'Active', value: contracts.filter(c => c.status === 'نشط').length, icon: CheckCircle, color: 'bg-emerald-500' },
    { label_ar: 'قيد المراجعة', label_en: 'In Review', value: contracts.filter(c => c.status === 'قيد المراجعة').length, icon: AlertCircle, color: 'bg-purple-500' },
  ];

  const today = new Date().toISOString().split('T')[0];

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

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">{t('لوحة التحكم', 'Dashboard', lang)}</h1>
        <div className="text-sm text-slate-500 flex space-x-4 space-x-reverse">
          <span>{today}</span>
          <span>|</span>
          <span>{toHijri(today)}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map(stat => (
          <div key={stat.label_ar} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4 space-x-reverse">
            <div className={`p-3 rounded-lg ${stat.color} text-white`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{t(stat.label_ar, stat.label_en, lang)}</p>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">{t('أحدث العقود', 'Recent Contracts', lang)}</h2>
        </div>
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-sm">
            <tr>
              <th className="px-6 py-3 font-medium">{t('رقم العقد', 'Contract No.', lang)}</th>
              <th className="px-6 py-3 font-medium">{t('العنوان', 'Title', lang)}</th>
              <th className="px-6 py-3 font-medium">{t('النوع', 'Type', lang)}</th>
              <th className="px-6 py-3 font-medium">{t('الحالة', 'Status', lang)}</th>
              <th className="px-6 py-3 font-medium">{t('التاريخ', 'Date', lang)}</th>
              <th className="px-6 py-3 font-medium">{t('إجراءات', 'Actions', lang)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contracts.map(contract => (
              <tr key={contract.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{contract.contract_number}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{contract.title_ar}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{contract.type}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                    {contract.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{contract.start_date}</td>
                <td className="px-6 py-4">
                  <button onClick={() => onEdit(contract.id)} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                    {t('تعديل', 'Edit', lang)}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
