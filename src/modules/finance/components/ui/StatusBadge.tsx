import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DocumentStatus, ProjectStatus, SubscriptionStatus, MilestoneStatus } from '../../types';

type StatusType = DocumentStatus | ProjectStatus | SubscriptionStatus | MilestoneStatus | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusColor = (status: StatusType) => {
    switch (status) {
      // Success / Active / Paid
      case DocumentStatus.Paid:
        return 'bg-green-50 text-green-700 border border-green-200';
      case ProjectStatus.Active:
      case SubscriptionStatus.Active:
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case MilestoneStatus.Completed:
      case DocumentStatus.Approved:
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';

      // Warning / Pending / Partially Paid
      case DocumentStatus.PartiallyPaid:
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case DocumentStatus.PendingApproval:
      case MilestoneStatus.InProgress:
      case SubscriptionStatus.Suspended:
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200';

      // Error / Cancelled / Overdue
      case DocumentStatus.Overdue:
      case SubscriptionStatus.Expired:
        return 'bg-red-50 text-red-700 border border-red-200';
      
      // Sent / Issued
      case DocumentStatus.Sent:
        return 'bg-violet-50 text-violet-700 border border-violet-200';
      case DocumentStatus.Issued:
      case MilestoneStatus.Invoiced:
        return 'bg-blue-50 text-blue-700 border border-blue-200';

      // Neutral / Draft
      case DocumentStatus.Draft:
      case ProjectStatus.Planned:
      case ProjectStatus.OnHold:
      case MilestoneStatus.Pending:
      case SubscriptionStatus.Draft:
        return 'bg-slate-100 text-slate-600';

      // Void / Cancelled (Inactive)
      case DocumentStatus.Void:
      case ProjectStatus.Cancelled:
      case SubscriptionStatus.Cancelled:
        return 'bg-slate-100 text-slate-400 line-through';

      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <span
      className={twMerge(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
        getStatusColor(status),
        className
      )}
    >
      {status.replace(/([A-Z])/g, ' $1').trim()}
    </span>
  );
}
