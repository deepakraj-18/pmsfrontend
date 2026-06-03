import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
    message?: string;
}

export function FieldError({ message }: FieldErrorProps) {
    if (!message) return null;
    return (
        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium" style={{ color: 'hsl(0 75% 55%)' }}>
            <AlertCircle size={11} />
            {message}
        </div>
    );
}
