import React from 'react';
import { Avatar } from 'primereact/avatar';

interface PersonAvatarProps {
    person?: any;
}

export function PersonAvatar({ person }: PersonAvatarProps) {
    if (!person) return <span className="text-slate-400">Unassigned</span>;
    

    if (typeof person === 'string') {
        return <span className="truncate min-w-0 font-medium" title={person}>{person}</span>;
    }

    const firstName = person.first_name || '';
    const lastName = person.last_name || '';
    const fallbackName = person.label || person.name || person.username || 'User';
    
    let name = `${firstName} ${lastName}`.trim();
    if (!name) name = fallbackName;

    const initials = name 
        ? name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : '?';

    return (
        <div className="flex items-center gap-2 max-w-full">
            <Avatar label={initials || '?'} shape="circle" size="normal"
                style={{ width: 24, height: 24, fontSize: 9, fontWeight: 700, flexShrink: 0,
                    background: 'linear-gradient(135deg,#0CD1C3,#6366f1)', color: '#fff' }} />
            <span className="truncate min-w-0 font-medium" title={name}>{name}</span>
        </div>
    );
}
