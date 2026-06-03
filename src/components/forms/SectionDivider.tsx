import React from 'react';

interface SectionDividerProps {
    title: string;
}

export function SectionDivider({ title }: SectionDividerProps) {
    return (
        <div className="flex items-center gap-2 col-span-full my-1">
            <div className="h-px flex-1" style={{ background: 'var(--border-color)' }} />
            <span className="text-[10px] font-bold tracking-widest uppercase px-2" style={{ color: 'var(--text-muted)' }}>{title}</span>
            <div className="h-px flex-1" style={{ background: 'var(--border-color)' }} />
        </div>
    );
}
