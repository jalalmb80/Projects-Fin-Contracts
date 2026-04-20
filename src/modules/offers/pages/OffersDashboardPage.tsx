import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useOffers } from '../hooks/useOffers';
import { OfferStatus, STATUS_LABELS } from '../types';
import { formatCurrency } from '../utils/pricing';
import WorkflowBadge from '../components/WorkflowBadge';

const STAT_STATUSES: OfferStatus[] = [
  'draft', 'under_review', 'pending_approval', 'approved',
  'sent_to_client', 'won', 'lost',
];

export default function OffersDashboardPage() {
  const { offers, loading } = useOffers();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const countByStatus = (status: OfferStatus) =>
    offers.filter(o => o.status === status).length;

  const totalValue  = offers.reduce((s, o) => s + (o.total_value ?? 0), 0);
  const wonOffers   = offers.filter(o => o.status === 'won');
  const sentOffers  = offers.filter(o => ['sent_to_client', 'won', 'lost'].includes(o.status));
  const winRate     = sentOffers.length > 0
    ? Math.round((wonOffers.length / sentOffers.length) * 100)
    : 0;

  const recent = offers.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Offers Dashboard</h1>
        <p className="text-sm text-slate-500">{offers.length} offer{offers.length !== 1 ? 's' : ''} total</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText size={16} className="text-violet-600" />}
          label="Total Offers"
          value={String(offers.length)}
          bg="bg-violet-50"
        />
        <StatCard
          icon={<TrendingUp size={16} className="text-emerald-600" />}
          label="Pipeline Value"
          value={formatCurrency(totalValue, 'SAR')}
          bg="bg-emerald-50"
        />
        <StatCard
          icon={<CheckCircle size={16} className="text-blue-600" />}
          label="Win Rate"
          value={`${winRate}%`}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<Clock size={16} className="text-amber-600" />}
          label="Pending Approval"
          value={String(countByStatus('pending_approval'))}
          bg="bg-amber-50"
        />
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAT_STATUSES.map(status => (
          <button
            key={status}
            onClick={() => navigate('/offers/list')}
            className="bg-white border border-slate-200 rounded-xl p-3 text-left hover:border-violet-200 transition-colors"
          >
            <p className="text-2xl font-bold text-slate-900">{countByStatus(status)}</p>
            <WorkflowBadge status={status} size="sm" />
          </button>
        ))}
      </div>

      {/* Recent offers */}
      {recent.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Recent Offers</h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">#</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Title</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Client</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500">Value</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map(o => (
                  <tr
                    key={o.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/offers/builder/${o.id}`)}
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{o.offer_number}</td>
                    <td className="px-4 py-2.5 text-slate-800 font-medium">
                      {o.language === 'ar' ? o.title_ar : o.title_en}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{o.client_name}</td>
                    <td className="px-4 py-2.5 text-right text-slate-800">
                      {formatCurrency(o.total_value, o.currency)}
                    </td>
                    <td className="px-4 py-2.5">
                      <WorkflowBadge status={o.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, bg,
}: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-slate-600">{label}</span></div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
