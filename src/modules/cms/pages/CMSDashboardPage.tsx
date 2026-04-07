import React from 'react';
import { useContracts } from '../hooks/useContracts';
import { usePlatform } from '../../../core/context/PlatformContext';
import { FileText, Clock, CheckCircle, AlertCircle, Plus, Users, ArrowLeft } from 'lucide-react';
import { useLang, t } from '../context/LanguageContext';
import { toHijri } from '../utils/hijriDate';
import { Link, useNavigate } from 'react-router-dom';

export default function CMSDashboardPage() {
  const { contracts } = useContracts();
  const { counterparties } = usePlatform();
  const { lang } = useLang();
  const navigate = useNavigate();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const signedThisMonth = contracts.filter(c => {
    if (c.status !== 'موقّع' && c.status !== 'نشط') return false;
    const date = new Date(c.start_date || c.created_at || Date.now());
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;

  const pendingSignatures = contracts.filter(c => c.status === 'قيد المراجعة' || c.status === 'مسودة').length;
  
  const totalValue = contracts.reduce((sum, c) => {
    return sum + (c.payment_schedule?.total_sar || 0);
  }, 0);

  const stats = [
    { label_ar: 'إجمالي العقود', label_en: 'Total Contracts', value: contracts.length, icon: FileText, color: 'bg-blue-500' },
    { label_ar: 'موقعة هذا الشهر', label_en: 'Signed This Month', value: signedThisMonth, icon: CheckCircle, color: 'bg-emerald-500' },
    { label_ar: 'بانتظار التوقيع', label_en: 'Pending Signatures', value: pendingSignatures, icon: Clock, color: 'bg-amber-500' },
    { label_ar: 'إجمالي قيمة العقود', label_en: 'Total Value', value: `${totalValue.toLocaleString()} ر.س`, icon: AlertCircle, color: 'bg-purple-500' },
  ];

  const recentContracts = [...contracts]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 5);

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

  const getClientName = (clientId: string) => {
    const client = counterparties.find(c => c.id === clientId);
    return client ? (client.nameAr || client.name) : 'Unknown';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">{t('لوحة التحكم', 'Dashboard', lang)}</h1>
        <div className="text-sm text-slate-500 flex space-x-4 space-x-reverse">
          <span>{today}</span>
          <span>|</span>
          <span>{toHijri(today)}</span>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Link to="/cms/contracts" className="flex items-center space-x-2 space-x-reverse bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus size={18} />
          <span>{t('عقد جديد', 'New Contract', lang)}</span>
        </Link>
        <Link to="/cms/contracts" className="flex items-center space-x-2 space-x-reverse bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-medium transition-colors">
          <FileText size={18} />
          <span>{t('عرض الكل', 'View All', lang)}</span>
        </Link>
        <Link to="/cms/clients" className="flex items-center space-x-2 space-x-reverse bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg font-medium transition-colors">
          <Users size={18} />
          <span>{t('الذهاب للعملاء', 'Go to Clients', lang)}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map(stat => (
          <div key={stat.label_ar} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4 space-x-reverse">
            <div className={`p-3 rounded-lg ${stat.color} text-white`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{t(stat.label_ar, stat.label_en, lang)}</p>
              <p className="text-xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">{t('أحدث العقود', 'Recent Contracts', lang)}</h2>
          <Link to="/cms/contracts" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center space-x-1 space-x-reverse">
            <span>{t('عرض الكل', 'View All', lang)}</span>
            <ArrowLeft size={16} />
          </Link>
        </div>
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-sm">
            <tr>
              <th className="px-6 py-3 font-medium">{t('رقم العقد', 'Contract No.', lang)}</th>
              <th className="px-6 py-3 font-medium">{t('العنوان', 'Title', lang)}</th>
              <th className="px-6 py-3 font-medium">{t('العميل', 'Client', lang)}</th>
              <th className="px-6 py-3 font-medium">{t('الحالة', 'Status', lang)}</th>
              <th className="px-6 py-3 font-medium">{t('التاريخ', 'Date', lang)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recentContracts.map(contract => (
              <tr key={contract.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/cms/contracts`)}>
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{contract.contract_number || '-'}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{contract.title_ar}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{getClientName(contract.client_id)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                    {contract.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{contract.start_date || '-'}</td>
              </tr>
            ))}
            {recentContracts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  {t('لا توجد عقود', 'No contracts found', lang)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
