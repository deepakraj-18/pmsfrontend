import React from 'react';
import { Dropdown as PrimeDropdown } from 'primereact/dropdown';
import type { DropdownProps as PrimeDropdownProps } from 'primereact/dropdown';

export interface DropdownSelectProps extends PrimeDropdownProps {
  
  isInvalid?: boolean;
}

export const DropdownSelect = React.forwardRef<HTMLDivElement, DropdownSelectProps>(
  ({ isInvalid = false, className = '', ...props }, ref) => {
    return (
      <PrimeDropdown
        ref={ref as any}
        invalid={isInvalid}
        optionLabel={props.optionLabel || "name"}
        optionValue={props.optionValue || "id"}
        pt={{
          root: {
            className: [
              'w-full h-11',
              'rounded-[var(--radius-sm,6px)]',
              'border border-slate-200 dark:border-slate-700',
              'bg-white dark:bg-slate-800/60',
              'text-[14px] text-slate-700 dark:text-slate-200',
              'outline-none focus:ring-2',
              'focus:ring-brand-teal-500/50 focus:border-brand-teal-500',
              'dark:focus:ring-brand-teal-400/50 dark:focus:border-brand-teal-400',
              'transition-shadow transition-colors duration-200',
              isInvalid ? 'border-red-400 focus:ring-red-500/50 focus:border-red-500' : '',
              className,
            ]
              .filter(Boolean)
              .join(' '),
          },
          input: {
            className: 'flex items-center h-full px-3.5 text-[14px] text-slate-700 dark:text-slate-200',
          },
          trigger: {
            className: 'flex items-center justify-center w-10 text-slate-400 dark:text-slate-500',
          },
          panel: {
            className: [
              'rounded-[var(--radius-sm,6px)]',
              'border border-slate-200 dark:border-slate-700',
              'bg-white dark:bg-slate-800',
              'shadow-lg shadow-slate-900/10',
              'mt-1',
            ].join(' '),
          },
          item: {
            className: [
              'px-3.5 py-2.5 text-[14px] text-slate-700 dark:text-slate-200',
              'hover:bg-brand-teal-50 dark:hover:bg-brand-teal-500/10',
              'transition-colors duration-150 cursor-pointer',
            ].join(' '),
          },
          emptyMessage: {
            className: 'px-3.5 py-2.5 text-[13px] text-slate-400 italic',
          },
        }}
        {...props}
      />
    );
  },
);

DropdownSelect.displayName = 'DropdownSelect';
