import React from 'react';
import { OfferStatus, STATUS_LABELS, STATUS_COLOR_MAP } from '../types';

interface Props {
  status: OfferStatus;
  size?: 'sm' | 'md';
}

export default function WorkflowBadge({ status, size = 'md' }: Props) {
  const meta  = STATUS_LABELS[status];
  const color = STATUS_COLOR_MAP[meta.color] ?? 'bg-gray-100 text-gray-600';
  const cls   = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${cls} ${color}`}>
      {meta.en}
    </span>
  );
}
