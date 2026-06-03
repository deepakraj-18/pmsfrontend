import React from 'react';
import { Checkbox as PrimeCheckbox } from 'primereact/checkbox';
import type { CheckboxProps as PrimeCheckboxProps } from 'primereact/checkbox';

export interface CheckboxInputProps extends Omit<PrimeCheckboxProps, 'checked'> {
  
  label?: string;
  
  checked?: boolean;
  
  className?: string;
}

export function CheckboxInput({ label, className = '', inputId, checked, ...props }: CheckboxInputProps) {
  return (
    <label
      htmlFor={inputId}
      className={`inline-flex items-center gap-2 cursor-pointer select-none ${className}`}
    >
      <PrimeCheckbox
        inputId={inputId}
        checked={checked ?? false}
        pt={{
          box: {
            className: [
              'w-4 h-4 rounded',
              'border border-slate-300 dark:border-slate-600',
              'transition-all duration-150',
            ].join(' '),
          },
          input: {
            className: 'sr-only',
          },
          icon: {
            className: 'text-white text-[10px]',
          },
        }}
        {...props}
      />
      {label && (
        <span className="text-[14px] text-slate-700 dark:text-slate-200">{label}</span>
      )}
    </label>
  );
}
