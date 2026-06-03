import React from 'react';
import { PRIORITY_COLORS } from '@/constants/constants';

interface PriorityBadgeProps {
    priority?: any;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
    const label = typeof priority === 'string' ? priority : priority?.label ?? priority?.name ?? 'None';
    const color = typeof priority === 'object' ? priority?.color : undefined;
    
    const clr = color ?? PRIORITY_COLORS[label.toLowerCase()] ?? PRIORITY_COLORS.none;
    
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold"
              style={{ background: `${clr}18`, color: clr }}>
            {label}
        </span>
    );
}
