import React from 'react';
import { Button as PrimeButton } from 'primereact/button';
import type { ButtonProps as PrimeButtonProps } from 'primereact/button';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PrimeButtonProps, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  unstyled?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', unstyled, style, ...props }, ref) => {
    if (unstyled) {
      return (
        <PrimeButton
          ref={ref as any}
          className={className}
          style={style}
          unstyled
          {...props}
        />
      );
    }

    const classMapping: Record<ButtonVariant, string> = {
      primary: 'text-slate-900 border-none shadow-[0_4px_15px_rgba(12,209,195,0.30)] hover:opacity-90 active:scale-[0.98]',
      secondary: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-teal-500 hover:text-brand-teal-600 dark:hover:text-brand-teal-400 shadow-sm',
      ghost: 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 border-none',
      danger: 'bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_12px_rgba(239,68,68,0.2)] border-none',
      gradient: 'text-slate-900 border-none shadow-[0_4px_15px_rgba(12,209,195,0.30)] hover:opacity-90 active:scale-[0.98]',
    };

    const sizeMapping: Record<ButtonSize, string> = {
      sm: 'h-8 px-3 text-[12px] gap-1.5 rounded-lg',
      md: 'h-10 px-5 text-[13.5px] gap-2 rounded-lg',
      lg: 'h-12 px-7 text-[15px] gap-2.5 rounded-2xl',
    };

    const brandGradient = "linear-gradient(135deg, #B3F57B 0%, #0CD1C3 100%)";
    const isBrandVariant = variant === 'primary' || variant === 'gradient';

    return (
      <PrimeButton
        ref={ref as any}
        pt={{
          root: {
            className: [
              'relative inline-flex items-center justify-center font-bold tracking-tight transition-all duration-200 select-none outline-none overflow-hidden group',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.97]',
              classMapping[variant],
              sizeMapping[size],
              className,
            ].filter(Boolean).join(' '),
            style: {
              ...(isBrandVariant ? { background: brandGradient } : {}),
              ...style,
            },
          },
          label: {
            className: 'leading-none',
          },
          icon: {
            className: 'text-[inherit] leading-none shrink-0',
          },
          loadingIcon: {
            className: 'animate-spin text-[inherit]',
          },
        }}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
