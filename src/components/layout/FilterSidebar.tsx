import { CheckboxInput } from "@/components/forms/CheckboxInput";
import React, { useMemo } from 'react';
import { X, Filter } from 'lucide-react';
import { Button } from 'primereact/button';

interface FilterOption {
    label: string;
    value: string;
}

interface FilterGroup {
    id: string;
    label: string;
    options: FilterOption[];
}

interface FilterSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    groups: FilterGroup[];
    selectedFilters: Record<string, string[]>;
    onFilterChange: (groupId: string, value: string) => void;
    onClear: () => void;
}

export function FilterSidebar({
    isOpen,
    onClose,
    groups,
    selectedFilters,
    onFilterChange,
    onClear
}: FilterSidebarProps) {
    const activeCount = useMemo(
        () => Object.values(selectedFilters).reduce((s, a) => s + a.length, 0),
        [selectedFilters]
    );

    if (!isOpen) return null;

    return (
        <>
            { }
            <div
                className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-[2px] z-[55] transition-opacity"
                onClick={onClose}
            />
            <div className="fixed inset-y-0 right-0 w-[300px] bg-theme-surface shadow-2xl z-[60] border-l border-theme-border animate-in slide-in-from-right duration-300">
                <div className="flex flex-col h-full">
                    { }
                    <div className="p-4 border-b border-theme-border flex items-center justify-between bg-theme-neutral">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-brand-teal-600" />
                            <h2 className="font-bold text-theme-primary text-[16px]">Filters</h2>
                            {activeCount > 0 && (
                                <span className="bg-brand-teal-600 text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {activeCount}
                                </span>
                            )}
                        </div>
                        <Button unstyled onClick={onClose} className="p-1.5 hover:bg-theme-surface rounded-full transition-colors">
                            <X className="w-5 h-5 text-theme-muted" />
                        </Button>
                    </div>

                    { }
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {groups.map(group => (
                            <div key={group.id} className="space-y-3">
                                <h3 className="text-[13px] font-bold text-[#374151] dark:text-gray-300 uppercase tracking-wider">{group.label}</h3>
                                <div className="space-y-1.5">
                                    {group.options.map(option => {
                                        const isSelected = selectedFilters[group.id]?.includes(option.value);
                                        return (
                                            <label key={option.value} className="flex items-center gap-2.5 cursor-pointer group px-2 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                                <div className="relative flex items-center">
                                                    <CheckboxInput
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => onFilterChange(group.id, option.value)}
                                                        className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-[#14b8a6] focus:ring-[#14b8a6]/20"
                                                    />
                                                </div>
                                                <span className={`text-[14px] transition-colors ${isSelected ? 'text-[#14b8a6] font-medium' : 'text-[#4B5563] dark:text-gray-400 group-hover:text-[#1F2937] dark:group-hover:text-gray-200'}`}>
                                                    {option.label}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    { }
                    <div className="p-4 border-t border-theme-border bg-theme-neutral flex gap-3">
                        <Button outlined className="flex-1" onClick={onClear}>
                            Clear All
                        </Button>
                        <Button className="flex-1" onClick={onClose}>
                            Apply Filters
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
