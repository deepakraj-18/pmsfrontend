import { CheckboxInput } from "@/components/forms/CheckboxInput";
import React, { useMemo } from 'react';
import { Filter } from 'lucide-react';
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

interface FilterPanelProps {
    groups: FilterGroup[];
    selectedFilters: Record<string, string[]>;
    onFilterChange: (groupId: string, value: string) => void;
    onClear: () => void;
    className?: string;
}

export function FilterPanel({
    groups,
    selectedFilters,
    onFilterChange,
    onClear,
    className = ""
}: FilterPanelProps) {
    const activeCount = useMemo(
        () => Object.values(selectedFilters).reduce((s, a) => s + a.length, 0),
        [selectedFilters]
    );

    return (
        <div className={`flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 transition-all ${className}`}>
            { }
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-brand-teal-600" />
                    <h2 className="font-bold text-slate-800 dark:text-white text-[14px] uppercase tracking-wider">Filters</h2>
                    {activeCount > 0 && (
                        <span className="bg-brand-teal-600 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center translate-y-[-1px]">
                            {activeCount}
                        </span>
                    )}
                </div>
                {activeCount > 0 && (
                    <Button
                        unstyled
                        onClick={onClear}
                        className="text-[11px] font-bold text-slate-400 hover:text-brand-teal-600 transition-colors uppercase tracking-widest"
                    >
                        Reset
                    </Button>
                )}
            </div>
            { }
            <div className="flex-1 overflow-y-auto p-4 space-y-7 custom-scrollbar">
                {groups.map(group => (
                    <div key={group.id} className="space-y-3.5">
                        <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">{group.label}</h3>
                        <div className="space-y-1">
                            {group.options.map(option => {
                                const isSelected = selectedFilters[group.id]?.includes(option.value);
                                return (
                                    <label key={option.value} className="flex items-center gap-2.5 cursor-pointer group px-2 py-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/50 hover:shadow-sm">
                                        <div className="relative flex items-center">
                                            <CheckboxInput
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => onFilterChange(group.id, option.value)}
                                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-brand-teal-600 focus:ring-brand-teal-600/20 focus:ring-offset-0 bg-transparent"
                                            />
                                        </div>
                                        <span className={`text-[13px] font-semibold truncate block w-full transition-colors ${isSelected ? 'text-brand-teal-600' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'}`} title={option.label}>
                                            {option.label}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
