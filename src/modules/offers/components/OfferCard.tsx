import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, User } from 'lucide-react';
import { Offer } from '../types';
import WorkflowBadge from './WorkflowBadge';
import { formatCurrency } from '../utils/pricing';

interface Props { offer: Offer; }

export default function OfferCard({ offer }: Props) {
  const navigate  = useNavigate();
  const title     = offer.language === 'ar' ? offer.title_ar : offer.title_en;
  const isExpired = offer.expiry_date && new Date(offer.expiry_date) < new Date()
    && !['won', 'lost', 'archived'].includes(offer.status);

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
        <WorkflowBadge status={offer.status} size="sm" />
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
          <span className={`flex items-center gap-1 ${isExpired ? 'text-red-500' : ''}`}>
            <Calendar size={11} />
            {offer.expiry_date}
          </span>
        )}
      </div>
    </div>
  );
}
