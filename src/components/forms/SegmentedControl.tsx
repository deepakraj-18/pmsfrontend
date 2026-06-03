import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/forms/Button';


export interface SegmentedControlOption<T extends string> {
  label: string;
  value: T;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  layoutId?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className = '',
  layoutId,
}: SegmentedControlProps<T>) {
  const generatedId = React.useId();
  const activeLayoutId = layoutId || generatedId;

  return (
    <div
      className={`relative flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-inner ${className}`}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <Button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            unstyled
            className={`
              relative z-10 flex items-center justify-center gap-1.5 h-[34px] px-4 rounded-lg 
              text-[12px] font-bold transition-colors duration-200 cursor-pointer outline-none select-none
              ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
            `}
          >
            {isActive && (
              <motion.div
                layoutId={activeLayoutId}
                className="absolute inset-0 z-[-1] bg-brand-teal-500 rounded-lg shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span className="leading-none">{opt.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
