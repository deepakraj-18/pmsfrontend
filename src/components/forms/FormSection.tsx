import React from 'react';

interface FormSectionProps {
    title: string;
    children: React.ReactNode;
}

export function FormSection({ title, children }: FormSectionProps) {
    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1" style={{ background: 'var(--border-color)' }} />
                <span className="text-[11px] font-bold tracking-widest uppercase px-2" style={{ color: 'var(--text-muted)' }}>{title}</span>
                <div className="h-px flex-1" style={{ background: 'var(--border-color)' }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {children}
            </div>
        </div>
    );
}
