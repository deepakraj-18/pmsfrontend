import React, { useState, useRef, useEffect } from 'react';
import { Edit2 } from 'lucide-react';
import { Dropdown } from 'primereact/dropdown';

interface InlineSelectCellProps {
    value: any;
    options: any[];
    onSave: (val: any) => void;
    renderValue?: (val: any) => React.ReactNode;
    optionLabel?: string;
    optionValue?: string;
    placeholder?: string;
    className?: string;
}

export function InlineSelectCell({ value, options, onSave, renderValue, optionLabel = 'label', optionValue = 'value', placeholder, className }: InlineSelectCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const dropdownRef = useRef<any>(null);

    useEffect(() => {
        if (isEditing && dropdownRef.current) {
            // Automatically open dropdown when editing starts
            setTimeout(() => {
                const trigger = dropdownRef.current?.getElement()?.querySelector('.p-dropdown-trigger');
                if (trigger) trigger.click();
            }, 50);
        }
    }, [isEditing]);

    const handleChange = (e: any) => {
        if (e.value !== value) {
            onSave(e.value);
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="flex items-center" onClick={e => e.stopPropagation()}>
                <Dropdown
                    ref={dropdownRef}
                    value={value}
                    options={options}
                    onChange={handleChange}
                    onHide={() => setIsEditing(false)}
                    optionLabel={optionLabel}
                    optionValue={optionValue}
                    placeholder={placeholder}
                    className="w-full text-xs p-dropdown-sm"
                    pt={{
                        input: { className: 'py-1 px-2 text-xs' }
                    }}
                />
            </div>
        );
    }

    return (
        <div 
            className={`editable-cell relative flex items-center gap-2 cursor-pointer rounded -ml-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${className || ''}`}
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        >
            <div className="flex-1 overflow-hidden">
                {renderValue ? renderValue(value) : (
                    <span className="truncate block">{value?.toString()}</span>
                )}
            </div>
        </div>
    );
}
