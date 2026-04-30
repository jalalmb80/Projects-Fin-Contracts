import React from 'react';
import { OfferStatus, STATUS_LABELS, STATUS_COLOR_MAP, OfferLanguage } from '../types';

interface Props {
  status:  OfferStatus;
  size?:   'sm' | 'md';
  /**
   * Language for the label. Defaults to 'en'.
   * Pass offer.language when the badge is inside an offer-specific context
   * (OfferCard, OfferBuilderPage header) so Arabic offers show Arabic labels.
   */
  lang?:   OfferLanguage;
}

export default function WorkflowBadge({ status, size = 'md', lang = 'en' }: Props) {
  const meta  = STATUS_LABELS[status];
  const label = meta[lang] ?? meta.en;
  const color = STATUS_COLOR_MAP[meta.color] ?? 'bg-gray-100 text-gray-600';
  const cls   = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${cls} ${color}`}>
      {label}
    </span>
  );
}
