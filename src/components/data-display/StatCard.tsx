import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card as PrimeCard } from 'primereact/card';
import { motion } from 'framer-motion';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  accentVariant?: 'teal' | 'amber' | 'violet' | 'rose';
}

const ACCENT: Record<string, { bubble: string; badge: string }> = {
  teal:   { bubble: 'bg-brand-teal-50 text-brand-teal-600 group-hover:bg-brand-teal-100',   badge: 'bg-emerald-50 text-emerald-700' },
  amber:  { bubble: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',                  badge: 'bg-amber-50 text-amber-700'    },
  violet: { bubble: 'bg-violet-50 text-violet-600 group-hover:bg-violet-100',               badge: 'bg-violet-50 text-violet-700'  },
  rose:   { bubble: 'bg-rose-50 text-rose-600 group-hover:bg-rose-100',                     badge: 'bg-rose-50 text-rose-700'      },
};

const TREND_BADGE: Record<string, { bg: string; label: string; Icon: React.ElementType }> = {
  up:      { bg: 'bg-emerald-50 text-emerald-700', label: 'Up',   Icon: TrendingUp   },
  down:    { bg: 'bg-rose-50 text-rose-700',        label: 'Down', Icon: TrendingDown },
  neutral: { bg: 'bg-slate-100 text-slate-500',     label: 'Flat', Icon: Minus        },
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  change,
  trend,
  className = '',
  accentVariant = 'teal',
}) => {
  const accent = ACCENT[accentVariant];
  const trendCfg = trend ? TREND_BADGE[trend] : null;
  const TrendIcon = trendCfg?.Icon;

  const renderValue = () => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object' && !React.isValidElement(value)) {

        return (value as any).label ?? (value as any).name ?? (value as any).value?.toString() ?? '—';
    }
    return value;
  };

  return (
    <motion.div
      className={`group w-full ${className}`}
      whileHover={{ y: -2, transition: { duration: 0.18, ease: 'easeOut' } }}
      layout
    >
      <PrimeCard
        pt={{
          root: {
            className:
              'rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 ' +
              'shadow-[var(--shadow-premium)] overflow-hidden w-full h-full transition-shadow duration-300 ' +
              'group-hover:shadow-[var(--shadow-card-hover)]',
          },
          body: { className: 'p-0 flex flex-col h-full bg-transparent' },
          title: { className: 'hidden' },
          content: { className: 'p-3.5 bg-transparent flex-1' },
        }}
      >
        {}
        <div className="flex items-start justify-between mb-2">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none pt-0.5">
            {label}
          </p>
          {icon && (
            <div className={`p-1.5 rounded-lg transition-all duration-300 flex-shrink-0 ${accent.bubble}`}>
              {icon}
            </div>
          )}
        </div>

        {}
        <div className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
          {renderValue()}
        </div>

        {}
        {(trendCfg || change) && (
          <div className="flex items-center gap-2 flex-wrap">
            {trendCfg && TrendIcon && (
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${trendCfg.bg}`}
              >
                <TrendIcon size={9} strokeWidth={2.5} />
                {trendCfg.label}
              </span>
            )}
            {change && (
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">
                {change}
              </p>
            )}
          </div>
        )}
      </PrimeCard>
    </motion.div>
  );
};
