import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  DollarSign, 
  Briefcase, 
  FileText, 
  Repeat, 
  TrendingUp, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLang, t } from '../context/LanguageContext';
import { ProjectStatus, DocumentStatus, SubscriptionStatus, DocumentDirection, Currency } from '../types';
import { KpiCard } from '../components/ui/KpiCard';
import { format } from 'date-fns';

export default function Dashboard() {
  const { 
    projects, 
    billingDocuments: invoices, 
    subscriptions, 
    loading, 
    user, 
    displayCurrency, 
    setDisplayCurrency, 
    formatMoney, 
    convert 
  } = useApp();
  const { lang } = useLang();

  if (loading.projects || loading.billingDocuments || loading.subscriptions) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // --- Metrics Calculations ---

  const totalAR = invoices
    .filter(i => i.direction === DocumentDirection.AR && i.status !== DocumentStatus.Draft && i.status !== DocumentStatus.Void)
    .reduce((sum, i) => sum + convert(i.total, i.currency, displayCurrency), 0);

  const totalAP = invoices
    .filter(i => i.direction === DocumentDirection.AP && i.status !== DocumentStatus.Draft && i.status !== DocumentStatus.Void)
    .reduce((sum, i) => sum + convert(i.total, i.currency, displayCurrency), 0);

  const overdueAmount = invoices
    .filter(i => i.status === DocumentStatus.Overdue)
    .reduce((sum, i) => sum + convert(i.balance, i.currency, displayCurrency), 0);

  const paidAR = invoices
    .filter(i => i.direction === DocumentDirection.AR && i.status === DocumentStatus.Paid)
    .reduce((sum, i) => sum + convert(i.total, i.currency, displayCurrency), 0);

  const paidAP = invoices
    .filter(i => i.direction === DocumentDirection.AP && i.status === DocumentStatus.Paid)
    .reduce((sum, i) => sum + convert(i.total, i.currency, displayCurrency), 0);

  const cashPosition = paidAR - paidAP;

  // --- Chart Data Preparation ---

  // Revenue Trend (Mocked for now based on months, ideally aggregated from invoices)
  const revenueTrendData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Apr', value: 2780 },
    { name: 'May', value: 1890 },
    { name: 'Jun', value: 2390 },
    { name: 'Jul', value: 3490 },
  ].map(d => ({ ...d, value: convert(d.value, 'USD' as Currency, displayCurrency) }));

  // AR / AP Breakdown
  const arApData = [
    { name: 'Accounts Receivable', value: totalAR, color: '#4f46e5' }, // primary-600
    { name: 'Accounts Payable', value: totalAP, color: '#ef4444' },   // rose-500
  ].filter(d => d.value > 0);

  // Recent Invoices
  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t('مرحباً بعودتك', 'Good morning', lang)}, {user?.displayName?.split(' ')[0] || 'User'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('إليك ما يحدث في مشاريعك اليوم.', "Here's what's happening with your projects today.", lang)}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3 space-x-reverse">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-medium text-slate-600">
            {format(new Date(), 'MMMM d, yyyy')}
          </div>
          <select
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value as Currency)}
            className="form-input py-2 pl-3 pr-10 text-sm border-slate-200 shadow-sm rounded-lg focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={Currency.USD}>USD ($)</option>
            <option value={Currency.SAR}>SAR (﷼)</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={t('إجمالي الذمم المدينة', 'Total Receivables', lang)}
          value={formatMoney(totalAR, displayCurrency)}
          icon={TrendingUp}
          color="indigo"
          trend={{ value: 12, direction: 'up', label: t('مقارنة بالشهر الماضي', 'vs last month', lang) }}
        />
        <KpiCard
          title={t('إجمالي الذمم الدائنة', 'Total Payables', lang)}
          value={formatMoney(totalAP, displayCurrency)}
          icon={FileText}
          color="rose"
          trend={{ value: 4, direction: 'down', label: t('مقارنة بالشهر الماضي', 'vs last month', lang) }}
        />
        <KpiCard
          title={t('المبالغ المتأخرة', 'Overdue Amount', lang)}
          value={formatMoney(overdueAmount, displayCurrency)}
          icon={AlertCircle}
          color="amber"
          trend={{ value: 2.5, direction: 'up', label: t('مقارنة بالشهر الماضي', 'vs last month', lang) }}
        />
        <KpiCard
          title={t('الوضع النقدي', 'Cash Position', lang)}
          value={formatMoney(cashPosition, displayCurrency)}
          icon={DollarSign}
          color="green"
          trend={{ value: 8, direction: 'up', label: t('مقارنة بالشهر الماضي', 'vs last month', lang) }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white shadow-sm rounded-xl border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">{t('اتجاه الإيرادات', 'Revenue Trend', lang)}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  tickFormatter={(value) => formatMoney(value, displayCurrency)}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1e293b' }}
                  formatter={(value: number) => [formatMoney(value, displayCurrency), t('الإيرادات', 'Revenue', lang)]}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#4f46e5" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AR / AP Breakdown */}
        <div className="bg-white shadow-sm rounded-xl border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">{t('الذمم المدينة مقابل الدائنة', 'Receivables vs Payables', lang)}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={arApData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {arApData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => formatMoney(value, displayCurrency)}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-center space-x-6">
              {arApData.map((entry) => (
                <div key={entry.name} className="flex items-center">
                  <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                  <span className="text-sm font-medium text-slate-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white shadow-sm rounded-xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">{t('أحدث الفواتير', 'Recent Invoices', lang)}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('المستند', 'Document', lang)}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('العميل', 'Counterparty', lang)}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('التاريخ', 'Date', lang)}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('الحالة', 'Status', lang)}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('المبلغ', 'Amount', lang)}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {recentInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-primary-600">{invoice.documentNumber || t('مسودة', 'Draft', lang)}</div>
                        <div className="text-xs text-slate-500">{invoice.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">{invoice.counterpartyName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-500">
                      {invoice.date ? format(new Date(invoice.date), 'MMM d, yyyy') : '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${invoice.status === DocumentStatus.Paid ? 'bg-emerald-100 text-emerald-800' : 
                        invoice.status === DocumentStatus.Overdue ? 'bg-rose-100 text-rose-800' : 
                        invoice.status === DocumentStatus.Sent ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">
                    {formatMoney(invoice.total, invoice.currency)}
                  </td>
                </tr>
              ))}
              {recentInvoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                    {t('لا توجد فواتير حديثة.', 'No recent invoices found.', lang)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
