import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { clsx } from 'clsx';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'indigo' | 'green' | 'amber' | 'rose';
  trend?: {
    value: number; // percentage
    direction: 'up' | 'down' | 'neutral';
    label?: string; // e.g., "vs last month"
  };
  className?: string;
  loading?: boolean;
}

export function KpiCard({ title, value, icon: Icon, color = 'indigo', trend, className, loading }: KpiCardProps) {
  if (loading) {
    return (
      <div className={clsx("bg-white overflow-hidden shadow rounded-xl p-5 animate-pulse border border-slate-100", className)}>
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-slate-200 rounded-md h-12 w-12"></div>
          <div className="ml-5 w-full">
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  const colorStyles = {
    indigo: { bar: 'bg-indigo-500', iconBg: 'bg-indigo-50', iconText: 'text-indigo-600' },
    green: { bar: 'bg-emerald-500', iconBg: 'bg-emerald-50', iconText: 'text-emerald-600' },
    amber: { bar: 'bg-amber-500', iconBg: 'bg-amber-50', iconText: 'text-amber-600' },
    rose: { bar: 'bg-rose-500', iconBg: 'bg-rose-50', iconText: 'text-rose-600' },
  };

  const styles = colorStyles[color];

  return (
    <div className={clsx(
      "relative bg-white overflow-hidden shadow-sm rounded-xl border border-slate-100 hover:shadow-md transition-shadow duration-200", 
      className
    )}>
      {/* Left colored accent bar */}
      <div className={clsx("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", styles.bar)}></div>

      <div className="p-5 pl-7">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{title}</p>
            <div className="mt-1 flex items-baseline">
              <p className="text-3xl font-bold text-slate-900">{value}</p>
            </div>
          </div>
          <div className={clsx("p-2.5 rounded-lg", styles.iconBg)}>
            <Icon className={clsx("h-6 w-6", styles.iconText)} aria-hidden="true" />
          </div>
        </div>

        {trend && (
          <div className="mt-4 flex items-center text-sm">
            <span
              className={clsx(
                "font-medium inline-flex items-center",
                trend.direction === 'up' ? 'text-emerald-600' : 
                trend.direction === 'down' ? 'text-rose-600' : 'text-slate-500'
              )}
            >
              {trend.direction === 'up' && <ArrowUpRight className="h-4 w-4 mr-1" />}
              {trend.direction === 'down' && <ArrowDownRight className="h-4 w-4 mr-1" />}
              {trend.direction === 'neutral' && <Minus className="h-4 w-4 mr-1" />}
              {Math.abs(trend.value)}%
            </span>
            <span className="text-slate-500 ml-2">{trend.label || 'vs last period'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
