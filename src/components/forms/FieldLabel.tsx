import React from 'react';

interface FieldLabelProps {
    label: string;
    required?: boolean;
    icon?: React.ReactNode;
}

export function FieldLabel({ label, required, icon }: FieldLabelProps) {
    return (
        <label className="flex items-center gap-1.5 text-[11px] font-bold mb-1.5 tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
            {icon && <span className="opacity-60">{icon}</span>}
            {label}
            {required && <span className="text-red-500 font-bold ml-0.5 text-[14px] leading-none">*</span>}
        </label>
    );
}
