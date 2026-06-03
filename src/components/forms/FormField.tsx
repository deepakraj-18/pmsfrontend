import React from 'react';

export interface FormFieldProps {
  
  label: string;
  
  htmlFor?: string;
  
  required?: boolean;
  
  children: React.ReactNode;
  
  className?: string;
  
  hint?: string;
  
  error?: string | { message?: string } | null;
}

export function FormField({
  label,
  htmlFor,
  required,
  children,
  className = '',
  hint,
  error,
}: FormFieldProps) {
  const errorMessage =
    typeof error === 'string'
      ? error
      : error?.message ?? 'Invalid value';

  return (
    <div
      className={`group flex flex-col gap-1 transition-colors duration-200 ${className}`}
    >
      {}
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
          {required && (
            <span className="text-red-500 font-bold ml-0.5 text-[14px] leading-none">*</span>
          )}
        </label>
      </div>

      {}
      <div className="relative">{children}</div>

      {}
      {hint && !error && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          {hint}
        </p>
      )}
      {error && (
        <p className="text-[11px] font-semibold text-red-500 mt-0.5 flex items-center gap-1">
          <svg
            className="w-3 h-3 flex-shrink-0"
            viewBox="0 0 12 12"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="6" cy="6" r="6" opacity="0.15" />
            <path
              d="M6 3v4M6 8.5v.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          {errorMessage}
        </p>
      )}
    </div>
  );
}
