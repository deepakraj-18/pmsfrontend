import React from 'react';
import { InputTextarea as PrimeInputTextarea } from 'primereact/inputtextarea';
import type { InputTextareaProps as PrimeInputTextareaProps } from 'primereact/inputtextarea';

export interface TextAreaInputProps extends Omit<PrimeInputTextareaProps, 'ref'> {
  
  isInvalid?: boolean;
}

export const TextAreaInput = React.forwardRef<HTMLTextAreaElement, TextAreaInputProps>(
  ({ isInvalid = false, className = '', rows = 4, autoResize = false, ...props }, ref) => {
    return (
      <PrimeInputTextarea
        ref={ref as any}
        invalid={isInvalid}
        rows={rows}
        autoResize={autoResize}
        pt={{
          root: {
            className: [
              'w-full min-h-[100px] p-3.5',
              'rounded-[var(--radius-sm,6px)]',
              'border border-slate-200 dark:border-slate-700',
              'bg-white dark:bg-slate-800/60',
              'text-[14px] text-slate-700 dark:text-slate-200',
              'placeholder:text-slate-400 dark:placeholder:text-slate-500',
              'outline-none focus:ring-2',
              'focus:ring-brand-teal-500/50 focus:border-brand-teal-500',
              'dark:focus:ring-brand-teal-400/50 dark:focus:border-brand-teal-400',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50',
              'resize-y transition-shadow transition-colors duration-200',
              isInvalid ? 'border-red-400 focus:ring-red-500/50 focus:border-red-500' : '',
              className,
            ]
              .filter(Boolean)
              .join(' '),
          },
        }}
        {...props}
      />
    );
  },
);

TextAreaInput.displayName = 'TextAreaInput';
