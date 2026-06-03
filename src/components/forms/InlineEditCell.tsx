import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { InputText } from 'primereact/inputtext';

interface InlineEditCellProps {
    value: string;
    onSave: (val: string) => void;
    renderValue?: (val: string) => React.ReactNode;
    placeholder?: string;
    className?: string;
}

export function InlineEditCell({ value, onSave, renderValue, placeholder, className }: InlineEditCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentVal, setCurrentVal] = useState(value || '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCurrentVal(value || '');
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = (e?: React.MouseEvent | React.KeyboardEvent) => {
        e?.stopPropagation();
        if (currentVal.trim() !== (value || '').trim()) {
            onSave(currentVal);
        }
        setIsEditing(false);
    };

    const handleCancel = (e?: React.MouseEvent | React.KeyboardEvent) => {
        e?.stopPropagation();
        setCurrentVal(value || '');
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave(e);
        if (e.key === 'Escape') handleCancel(e);
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <InputText
                    ref={inputRef}
                    value={currentVal}
                    onChange={(e) => setCurrentVal(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="p-inputtext-sm w-full max-w-[250px]"
                    placeholder={placeholder}
                />
                <button
                    onClick={handleSave}
                    className="p-1 text-teal-600 hover:bg-teal-50 rounded transition-colors flex-shrink-0"
                    title="Save"
                >
                    <Check size={16} />
                </button>
                <button
                    onClick={handleCancel}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
                    title="Cancel"
                >
                    <X size={16} />
                </button>
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
                    <span className="truncate block" title={value}>{value}</span>
                )}
            </div>
        </div>
    );
}
