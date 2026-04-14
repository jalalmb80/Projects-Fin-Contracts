import React from 'react';
import { useContracts } from '../hooks/useContracts';
import { FileText, Clock, CheckCircle, AlertCircle, Plus, Users, ChevronRight } from 'lucide-react';
import { useLang, t } from '../context/LanguageContext';
import { toHijri } from '../utils/hijriDate';
import { Link, useNavigate } from 'react-router-dom';

export default function CMSDashboardPage() {
  const { contracts, clients } = useContracts();
  const { lang } = useLang();
  const navigate = useNavigate();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const signedThisMonth = contracts.filter(c => {
    if (c.status !== 'موقّع' && c.status !== 'نشط') return false;
    const date = new Date(c.start_date || Date.now());
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;

  const pendingSignatures = contracts.filter(c => c.status === 'قيد المراجعة' || c.status === 'مسودة').length;
  const totalValue = contracts.reduce((sum, c) => sum + (c.payment_schedule?.total_sar || 0), 0);

  const stats = [
    { label_ar: 'إجمالي العقود', label_en: 'Total Contracts', value: contracts.length, icon: FileText, color: 'bg-blue-500' },
    { label_ar: 'موقعة هذا الشهر', label_en: 'Signed This Month', value: signedThisMonth, icon: CheckCircle, color: 'bg-emerald-500' },
    { label_ar: 'بانتظار التوقيع', label_en: 'Pending Signatures', value: pendingSignatures, icon: Clock, color: 'bg-amber-500' },
    { label_ar: 'إجمالي قيمة العقود', label_en: 'Total Value', value: `${totalValue.toLocaleString()} ر.س`, icon: AlertCircle, color: 'bg-purple-500' },
  ];

  const recentContracts = [...contracts]
    .sort((a, b) => new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime())
    .slice(0, 5);

  const today = new Date().toISOString().split('T')[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'مسودة': return 'bg-amber-100 text-amber-800';
      case 'نشط': return 'bg-green-100 text-green-800';
      case 'قيد المراجعة': return 'bg-purple-100 text-purple-800';
      case 'موقّع': return 'bg-blue-100 text-blue-800';
      case 'مكتمل': return 'bg-gray-100 text-gray-800';
      case 'منتهي': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? ((client as any).name_ar || (client as any).name) : t('غير معروف', 'Unknown', lang);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('لوحة التحكم', 'Dashboard', lang)}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-500">{today}</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">{toHijri(today)}</span>
          </div>
        </div>
      </div>

      {/* BUG-7 FIX: Action buttons — "New Contract" now navigates to /cms/contracts
          with ?new=1 so ContractsPage auto-opens the editor */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate('/cms/contracts?new=1')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('عقد جديد', 'New Contract', lang)}
        </button>
        <Link to="/cms/contracts" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
          <FileText className="mr-2 h-4 w-4" />
          {t('عرض الكل', 'View All', lang)}
        </Link>
        <Link to="/cms/clients" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
          <Users className="mr-2 h-4 w-4" />
          {t('العملاء', 'Clients', lang)}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(stat => (
          <div key={stat.label_ar} className="bg-white shadow rounded-lg p-6 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.color} text-white shrink-0"}><stat.icon size={22} /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t(stat.label_ar, stat.label_en, lang)}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium leading-6 text-gray-900">{t('أحدث العقود', 'Recent Contracts', lang)}</h2>
          <Link to="/cms/contracts" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            {t('عرض الكل', 'View All', lang)}<ChevronRight size={16} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>
              {[t('رقم العقد','Contract No.',lang),t('العنوان','Title',lang),t('العميل','Client',lang),t('الحالة','Status',lang),t('التاريخ','Date',lang)].map(h => (
                <th key={h} scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentContracts.map(contract => (
                <tr key={contract.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate('/cms/contracts')}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">{contract.contract_number || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.title_ar}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getClientName(contract.client_id)}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(contract.status)}`}>{contract.status}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.start_date || '-'}</td>
                </tr>
              ))}
              {recentContracts.length === 0 && (<tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">{t('لا توجد عقود', 'No contracts found', lang)}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
