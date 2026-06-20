import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, User } from 'lucide-react';
import { Offer } from '../types';
import WorkflowBadge from './WorkflowBadge';
import { formatCurrency } from '../utils/pricing';
import { parseISO, isBefore, startOfDay } from 'date-fns';

interface Props { offer: Offer; }

export default function OfferCard({ offer }: Props) {
  const navigate = useNavigate();
  const title    = offer.language === 'ar' ? offer.title_ar : offer.title_en;

  // Audit F2 fix: compare against startOfDay(now) in local timezone, not
  // raw Date comparison which mis-fires for UTC-midnight expiry dates.
  const isExpired = (() => {
    if (!offer.expiry_date) return false;
    if (['won', 'lost', 'archived'].includes(offer.status)) return false;
    try {
      return isBefore(parseISO(offer.expiry_date), startOfDay(new Date()));
    } catch {
      return false;
    }
  })();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/offers/builder/${offer.id}`)}
      onKeyDown={e => e.key === 'Enter' && navigate(`/offers/builder/${offer.id}`)}
      className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm hover:border-violet-200 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-400 font-mono mb-0.5">{offer.offer_number}</p>
          <h3 className="font-medium text-slate-900 text-sm truncate">{title}</h3>
        </div>
        {/* Pass offer.language so Arabic offers show Arabic status labels */}
        <WorkflowBadge status={offer.status} size="sm" lang={offer.language} />
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <User size={11} />
          {offer.client_name || '—'}
        </span>
        <span className="flex items-center gap-1">
          <DollarSign size={11} />
          {formatCurrency(offer.total_value, offer.currency)}
        </span>
        {offer.expiry_date && (
          <span className={`flex items-center gap-1 ${isExpired ? 'text-red-500 font-medium' : ''}`}>
            <Calendar size={11} />
            {offer.expiry_date}
            {isExpired && ' ⚠'}
          </span>
        )}
      </div>
    </div>
  );
}
