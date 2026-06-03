import React from 'react';
import { Tag as PrimeTag } from 'primereact/tag';

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border border-emerald-200 dark:border-emerald-500/30',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border border-amber-200 dark:border-amber-500/30',
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-500/10',
    text: 'text-red-700 dark:text-red-400',
    border: 'border border-red-200 dark:border-red-500/30',
  },
  info: {
    bg: 'bg-sky-50 dark:bg-sky-500/10',
    text: 'text-sky-700 dark:text-sky-400',
    border: 'border border-sky-200 dark:border-sky-500/30',
  },
  secondary: {
    bg: 'bg-slate-100 dark:bg-slate-500/10',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border border-slate-200 dark:border-slate-600/30',
  },
};

function resolveStatusSeverity(status: string): BadgeSeverity {
  switch ((status || '').toLowerCase()) {
    case 'active':
    case 'in progress':
    case 'open':
    case 'development':
      return 'info';
    case 'completed':
    case 'done':
    case 'resolved':
    case 'deployment':
    case 'testing':
      return 'success';
    case 'pending':
    case 'on hold':
    case 'on leave':
    case 'medium':
      return 'warning';
    case 'blocked':
    case 'cancelled':
    case 'closed':
    case 'inactive':
    case 'critical':
    case 'high':
      return 'danger';
    case 'planning':
    case 'low':
      return 'info';
    default:
      return 'secondary';
  }
}

function resolvePrioritySeverity(priority: string): BadgeSeverity {
  switch ((priority || '').toLowerCase()) {
    case 'critical':
    case 'high':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'secondary';
  }
}

export type BadgeSeverity = 'success' | 'warning' | 'danger' | 'info' | 'secondary';
export type BadgeVariant = 'status' | 'priority' | 'phase' | 'neutral';

export interface BadgeProps {
  
  value?: string;
  
  label?: string;
  severity?: BadgeSeverity;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ value, label, severity, variant = 'status', className = '' }: BadgeProps) {
  const displayValue = value ?? label ?? '';
  const resolvedSeverity: BadgeSeverity = severity
    ? severity
    : variant === 'neutral'
      ? 'secondary'
      : variant === 'priority'
        ? resolvePrioritySeverity(displayValue)
        : resolveStatusSeverity(displayValue);

  const styles = SEVERITY_STYLES[resolvedSeverity] ?? SEVERITY_STYLES.secondary;

  return (
    <PrimeTag
      value={displayValue}
      pt={{
        root: {
          className: [
            'inline-flex items-center gap-1',
            'px-2.5 py-0.5',
            'rounded-full',
            'text-[11px] font-semibold tracking-wide uppercase',
            styles.bg,
            styles.text,
            styles.border,
            'shadow-none',
            className,
          ]
            .filter(Boolean)
            .join(' '),
        },
      }}
    />
  );
}
