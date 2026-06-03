import React from 'react';
import { THEME_COLORS } from '@/constants/constants';

interface StatusBadgeProps {
    status?: any;
    defaultColor?: string;
    onDark?: boolean;
}

export function StatusBadge({ status, defaultColor = THEME_COLORS.TEAL, onDark = false }: StatusBadgeProps) {
    const label = typeof status === 'string' ? status : status?.label ?? '—';
    const color = typeof status === 'object' ? status?.color ?? defaultColor : defaultColor;
    
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={onDark ? { background: 'rgba(255,255,255,0.9)', color: color, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' } : { background: `${color}22`, color: color, border: `1px solid ${color}33` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            {label}
        </span>
    );
}
