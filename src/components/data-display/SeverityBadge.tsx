import React from 'react';
import { SEVERITY_COLORS } from '@/constants/constants';

interface SeverityBadgeProps {
    severity?: any;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
    const label = typeof severity === 'string' ? severity : (severity?.label ?? severity?.name ?? 'Normal');
    const key = label.toLowerCase();
    const clr = SEVERITY_COLORS[key] || SEVERITY_COLORS.normal;
    
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold"
              style={{ background: `${clr}18`, color: clr }}>
            {label}
        </span>
    );
}
