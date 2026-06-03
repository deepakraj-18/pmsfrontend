import React from 'react';
import { THEME_COLORS } from '@/constants/constants';

interface DetailFieldRowProps {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
    color?: string;
}

export function DetailFieldRow({ icon, label, children, color = THEME_COLORS.TEAL }: DetailFieldRowProps) {
    const renderChildren = () => {
        if (children === null || children === undefined) return '—';
        if (typeof children === 'object' && !React.isValidElement(children)) {
            const obj = children as any;
            return obj.label ?? obj.name ?? obj.project_name ?? obj.value?.toString() ?? '—';
        }
        return children;
    };

    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                 style={{ background: `${color}12`, color: color }}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-slate-500">
                    {label}
                </p>
                <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                    {renderChildren()}
                </div>
            </div>
        </div>
    );
}
