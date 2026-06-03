import React from 'react';

const AVATAR_COLORS = [
    '#14b8a6', '#0891B2', '#7C3AED', '#DB2777', '#D97706',
    '#2563EB', '#DC2626', '#4F46E5', '#0D9488', '#9333EA',
    '#EA580C', '#16A34A', '#0284C7', '#C026D3', '#CA8A04',
];

function getColorFromName(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface UserAvatarProps {
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-8 h-8 text-[13px]',
    lg: 'w-10 h-10 text-[15px]',
};

export function UserAvatar({ firstName, lastName, imageUrl, size = 'md', className = '' }: UserAvatarProps) {
    const initials = `${(firstName || '?')[0]}${(lastName || '')[0] || ''}`.toUpperCase();
    const bgColor = getColorFromName(`${firstName || ''}${lastName || ''}`);

    if (imageUrl) {
        return (
            <img
                src={imageUrl}
                alt={`${firstName || ''} ${lastName || ''}`}
                className={`rounded-full object-cover flex-shrink-0 ${sizeClasses[size]} ${className}`}
            />
        );
    }

    return (
        <div
            className={`rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ${sizeClasses[size]} ${className}`}
            style={{ backgroundColor: bgColor }}
            title={`${firstName || ''} ${lastName || ''}`.trim()}
        >
            {initials}
        </div>
    );
}
