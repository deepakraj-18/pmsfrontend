import React from 'react';
import { InputText as PrimeInputText } from 'primereact/inputtext';
import type { InputTextProps as PrimeInputTextProps } from 'primereact/inputtext';

export interface TextInputProps extends Omit<PrimeInputTextProps, 'ref' | 'value'> {
  
  isInvalid?: boolean;
  
  value?: string | number;
  
  error?: string;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ isInvalid = false, error, className = '', value, ...props }, ref) => {
    
    const normalizedValue = value !== undefined ? String(value) : undefined;
    
    const isFieldInvalid = isInvalid || !!error;
    return (
      <PrimeInputText
        ref={ref as any}
        invalid={isFieldInvalid}
        value={normalizedValue}
        pt={{
          root: {
            className: [
              'w-full h-11 px-3.5',
              'rounded-[var(--radius-sm,6px)]',
              'border border-slate-200 dark:border-slate-700',
              'bg-white dark:bg-slate-800/60',
              'text-[14px] text-slate-700 dark:text-slate-200',
              'placeholder:text-slate-400 dark:placeholder:text-slate-500',
              'outline-none focus:ring-2',
              'focus:ring-brand-teal-500/50 focus:border-brand-teal-500',
              'dark:focus:ring-brand-teal-400/50 dark:focus:border-brand-teal-400',
              'transition-shadow transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-800',
              'transition-all duration-200',
              isFieldInvalid ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : '',
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

TextInput.displayName = 'TextInput';
