import React from 'react';
import { Card as PrimeCard, CardProps as PrimeCardProps } from 'primereact/card';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends PrimeCardProps {
  children?: React.ReactNode;
  accentColor?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  motionProps?: HTMLMotionProps<'div'>;
  hoverEffect?: boolean;
  noPadding?: boolean;
  glass?: boolean;
  overflowVisible?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  pt,
  accentColor,
  title,
  subtitle,
  actions,
  motionProps,
  hoverEffect = true,
  noPadding = false,
  glass = false,
  overflowVisible = false,
  ...props
}) => {
  const isInlineBg = accentColor && (accentColor.startsWith('#') || accentColor.startsWith('rgb'));

  const cardPt = {
    root: {
      className: [
        'rounded-3xl bg-white dark:bg-slate-900',
        'border border-slate-100 dark:border-slate-800',
        'shadow-[var(--shadow-premium)]',
        'relative w-full h-full',
        overflowVisible ? 'overflow-visible' : 'overflow-hidden',
        'transition-shadow duration-300',
        glass ? 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-md' : '',
        props.className || '',
      ].filter(Boolean).join(' '),
    },
    body: { className: 'p-0 flex flex-col h-full bg-transparent' },
    title: { className: 'hidden' },
    content: { className: `flex-1 overflow-y-auto no-scrollbar ${noPadding ? '' : 'py-2'} bg-transparent` },
    ...pt,
  };

  const inner = (
    <PrimeCard pt={cardPt} {...props}>
      {accentColor && (
        <div
          className={`absolute left-0 top-0 bottom-0 w-[3px] ${!isInlineBg ? accentColor : ''}`}
          style={isInlineBg ? { backgroundColor: accentColor } : {}}
        />
      )}

      {(title || subtitle || actions) && (
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex flex-col gap-0.5">
            {title && (
              <h3 className="text-[14px] font-bold text-slate-900 dark:text-slate-100 tracking-tight border-l-2 border-brand-teal-400 pl-3">
                {title as React.ReactNode}
              </h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-slate-400 font-medium pl-3">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
      )}

      <div className={noPadding ? '' : 'py-2'}>{children}</div>
    </PrimeCard>
  );

  if (hoverEffect || motionProps) {
    return (
      <motion.div
        whileHover={hoverEffect ? { y: -2, transition: { duration: 0.2, ease: 'easeOut' } } : undefined}
        layout
        className="w-full h-full"
        {...motionProps}
      >
        {inner}
      </motion.div>
    );
  }

  return <div className="w-full h-full">{inner}</div>;
};
