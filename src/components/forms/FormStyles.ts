import { classNames } from 'primereact/utils';

export const inputCls = (hasError?: boolean) => classNames(
    'w-full rounded-xl px-3 transition-all outline-none',
    hasError
        ? 'border border-red-400 focus:ring-red-200 focus:border-red-500'
        : 'focus:ring-[hsl(160_60%_45%_/_0.2)] focus:border-[hsl(160_60%_45%)]',
);
