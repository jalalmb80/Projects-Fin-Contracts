import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  DollarSign, Briefcase, FileText, Repeat, TrendingUp, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLang, t, tEnum } from '../context/LanguageContext';
import { ProjectStatus, DocumentStatus, SubscriptionStatus, DocumentDirection, Currency } from '../types';
import { KpiCard } from '../components/ui/KpiCard';
import { format } from 'date-fns';

function getGreeting(lang: 'ar' | 'en'): string {
  const hour = new Date().getHours();
  if (hour < 12) return t('صباح الخير', 'Good morning', lang);
  if (hour < 18) return t('مساء الخير', 'Good afternoon', lang);
  return t('مساء النور', 'Good evening', lang);
}

export default function Dashboard() {
  const {
    projects,
    billingDocuments: invoices,
    subscriptions,
    loading,
    user,
    displayCurrency,
    formatMoney,
    settings,
  } = useApp();
  const { lang } = useLang();

  if (loading.projects || loading.billingDocuments || loading.subscriptions) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const kpis = useMemo(() => {
    const cvt = (amount: number, currency: Currency): number => {
      if (currency === displayCurrency) return amount;
      if (currency === Currency.USD && displayCurrency === Currency.SAR) return amount * settings.usdToSarRate;
      if (currency === Currency.SAR && displayCurrency === Currency.USD) return amount / settings.usdToSarRate;
      return amount;
    };

    const now = new Date();
    const curMonth  = format(now, 'yyyy-MM');
    const prevMonth = format(new Date(now.getFullYear(), now.getMonth() - 1, 1), 'yyyy-MM');

    const monthSum = (dir: DocumentDirection, monthKey: string, statusFilter?: DocumentStatus): number =>
      invoices
        .filter(i =>
          i.direction === dir &&
          (statusFilter ? i.status === statusFilter : i.status !== DocumentStatus.Draft && i.status !== DocumentStatus.Void) &&
          (i.date ?? '').startsWith(monthKey)
        )
        .reduce((s, i) => s + cvt(i.total, i.currency), 0);

    const totalAR = invoices
      .filter(i => i.direction === DocumentDirection.AR && i.status !== DocumentStatus.Draft && i.status !== DocumentStatus.Void)
      .reduce((s, i) => s + cvt(i.total, i.currency), 0);
    const totalAP = invoices
      .filter(i => i.direction === DocumentDirection.AP && i.status !== DocumentStatus.Draft && i.status !== DocumentStatus.Void)
      .reduce((s, i) => s + cvt(i.total, i.currency), 0);
    const overdueAmount = invoices
      .filter(i => i.status === DocumentStatus.Overdue)
      .reduce((s, i) => s + cvt(i.balance, i.currency), 0);
    const overdueCount  = invoices.filter(i => i.status === DocumentStatus.Overdue).length;
    const cashPosition  =
      invoices.filter(i => i.direction === DocumentDirection.AR && i.status === DocumentStatus.Paid).reduce((s, i) => s + cvt(i.total, i.currency), 0) -
      invoices.filter(i => i.direction === DocumentDirection.AP && i.status === DocumentStatus.Paid).reduce((s, i) => s + cvt(i.total, i.currency), 0);
    const activeProjects      = projects.filter(p => p.status === ProjectStatus.Active).length;
    const activeSubscriptions = subscriptions.filter(s => s.status === SubscriptionStatus.Active).length;

    const makeTrend = (cur: number, prev: number) => {
      if (prev === 0) return undefined;
      return { value: Math.round(Math.abs((cur - prev) / prev) * 100), direction: (cur >= prev ? 'up' : 'down') as 'up' | 'down' };
    };
    const arTrend   = makeTrend(monthSum(DocumentDirection.AR, curMonth), monthSum(DocumentDirection.AR, prevMonth));
    const apTrend   = makeTrend(monthSum(DocumentDirection.AP, curMonth), monthSum(DocumentDirection.AP, prevMonth));
    const cashTrend = makeTrend(
      monthSum(DocumentDirection.AR, curMonth,  DocumentStatus.Paid) - monthSum(DocumentDirection.AP, curMonth,  DocumentStatus.Paid),
      monthSum(DocumentDirection.AR, prevMonth, DocumentStatus.Paid) - monthSum(DocumentDirection.AP, prevMonth, DocumentStatus.Paid)
    );

    const revenueTrendData = Array.from({ length: 6 }, (_, i) => {
      const d   = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = format(d, 'yyyy-MM');
      return {
        name:  format(d, 'MMM'),
        value: invoices
          .filter(inv => inv.direction === DocumentDirection.AR && inv.status !== DocumentStatus.Draft && inv.status !== DocumentStatus.Void && (inv.date ?? '').startsWith(key))
          .reduce((sum, inv) => sum + cvt(inv.total, inv.currency), 0),
      };
    });

    const arApData = [
      { name: t('الذمم المدينة', 'Receivables', lang), value: totalAR, color: '#4f46e5' },
      { name: t('الذمم الدائنة', 'Payables',    lang), value: totalAP, color: '#ef4444' },
    ].filter(d => d.value > 0);

    const recentInvoices = [...invoices]
      .sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime())
      .slice(0, 5);

    return { totalAR, totalAP, overdueAmount, overdueCount, cashPosition, activeProjects, activeSubscriptions, arTrend, apTrend, cashTrend, revenueTrendData, arApData, recentInvoices };
  }, [invoices, projects, subscriptions, displayCurrency, settings.usdToSarRate, lang]);

  const { totalAR, totalAP, overdueAmount, overdueCount, cashPosition, activeProjects, activeSubscriptions, arTrend, apTrend, cashTrend, revenueTrendData, arApData, recentInvoices } = kpis;
  const trendLabel = t('مقارنة بالشهر الماضي', 'vs last month', lang);

  const getStatusBadgeClass = (status: DocumentStatus): string => {
    switch (status) {
      case DocumentStatus.Paid:          return 'bg-emerald-100 text-emerald-800';
      case DocumentStatus.Overdue:       return 'bg-rose-100 text-rose-800';
      case DocumentStatus.Sent:          return 'bg-blue-100 text-blue-800';
      case DocumentStatus.PartiallyPaid: return 'bg-amber-100 text-amber-800';
      case DocumentStatus.Draft:         return 'bg-slate-100 text-slate-600';
      default:                           return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header — greeting + overdue alert only.
          Date and currency switcher live in Layout.tsx header so they appear
          on every Finance page. Rendering them here too caused duplicates. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {getGreeting(lang)}, {user?.displayName?.split(' ')[0] || t('المستخدم', 'User', lang)}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('إليك ما يحدث في مشاريعك اليوم.', "Here's what's happening with your projects today.", lang)}
          </p>
        </div>
        {overdueCount > 0 && (
          <Link
            to="/finance/billing"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <AlertCircle className="h-4 w-4" />
            {overdueCount} {t('متأخرة', 'overdue', lang)}
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard title={t('إجمالي الذمم المدينة', 'Total Receivables',    lang)} value={formatMoney(totalAR,       displayCurrency)} icon={TrendingUp}  color="indigo" trend={arTrend   ? { ...arTrend,   label: trendLabel } : undefined} />
        <KpiCard title={t('إجمالي الذمم الدائنة', 'Total Payables',       lang)} value={formatMoney(totalAP,       displayCurrency)} icon={FileText}    color="rose"   trend={apTrend   ? { ...apTrend,   label: trendLabel } : undefined} />
        <KpiCard title={t('المبالغ المتأخرة',      'Overdue Amount',       lang)} value={formatMoney(overdueAmount, displayCurrency)} icon={AlertCircle} color="amber" />
        <KpiCard title={t('الوضع النقدي',          'Cash Position',        lang)} value={formatMoney(cashPosition,  displayCurrency)} icon={DollarSign}  color="green"  trend={cashTrend ? { ...cashTrend, label: trendLabel } : undefined} />
        <KpiCard title={t('المشاريع النشطة',       'Active Projects',      lang)} value={activeProjects}      icon={Briefcase} color="indigo" />
        <KpiCard title={t('الاشتراكات النشطة',     'Active Subscriptions', lang)} value={activeSubscriptions} icon={Repeat}    color="green"  />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-xl border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">{t('اتجاه الإيرادات', 'Revenue Trend', lang)}</h3>
          <p className="text-xs text-slate-400 mb-5">{t('الفواتير الصادرة — آخر 6 أشهر', 'Issued AR invoices — last 6 months', lang)}</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v: number) => formatMoney(v, displayCurrency)} width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#1e293b' }}
                formatter={(v: number) => [formatMoney(v, displayCurrency), t('الإيرادات', 'Revenue', lang)]}
              />
              <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white shadow-sm rounded-xl border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">{t('الذمم المدينة مقابل الدائنة', 'Receivables vs Payables', lang)}</h3>
          <p className="text-xs text-slate-400 mb-5">{t('المستندات المعتمدة والصادرة فقط', 'Approved & issued documents only', lang)}</p>
          {arApData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={arApData} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={5} dataKey="value">
                    {arApData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(v: number) => formatMoney(v, displayCurrency)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex justify-center gap-6">
                {arApData.map(entry => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm text-slate-600">{entry.name}</span>
                    <span className="text-sm font-semibold text-slate-800">{formatMoney(entry.value, displayCurrency)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              {t('لا توجد بيانات كافية للعرض', 'No data available to display', lang)}
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white shadow-sm rounded-xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{t('أحدث الفواتير', 'Recent Invoices', lang)}</h3>
          <Link to="/finance/billing" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            {t('عرض الكل', 'View all', lang)} →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('المستند',       'Document',     lang)}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('الطرف المقابل', 'Counterparty', lang)}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('التاريخ',       'Date',         lang)}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('الحالة',        'Status',       lang)}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('المبلغ',        'Amount',       lang)}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {recentInvoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <Link to={`/finance/billing/${invoice.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                          {invoice.documentNumber || t('مسودة', 'Draft', lang)}
                        </Link>
                        <div className="text-xs text-slate-500">{tEnum(invoice.type, lang)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{invoice.counterpartyName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {invoice.date ? format(new Date(invoice.date), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(invoice.status)}`}>
                      {tEnum(invoice.status, lang)}
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
