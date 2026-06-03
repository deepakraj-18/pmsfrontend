import React, { useMemo } from 'react';
import { useStatuses } from '@/features/masters/hooks/useMasters';
import { Dropdown } from 'primereact/dropdown';

interface FilteredStatusSelectProps {
  module: 'tasks' | 'issues';
  value: any;
  onChange: (val: any) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  currentOriginalStatusName?: string;
}

export const FilteredStatusSelect: React.FC<FilteredStatusSelectProps> = ({
  module,
  value,
  onChange,
  className = '',
  placeholder = 'Select Status',
  disabled,
}) => {
  const { data: statuses = [], isLoading } = useStatuses();

  const options = useMemo(() => statuses, [statuses]);


  const currentId: number | null = useMemo(() => {
    if (!value) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value?.id != null) return Number(value.id);
    if (typeof value === 'string' && !isNaN(Number(value))) return Number(value);

    const byName = options.find(o => o.name === value);
    return byName ? byName.id : null;
  }, [value, options]);

  return (
    <div className={`form-field-shell ${className}`}>
      <Dropdown
        value={currentId}
        options={options}
        optionLabel="name"
        optionValue="id"
        onChange={(e) => {
          const found = options.find(o => o.id === e.value) || null;
          onChange(found);
        }}
        itemTemplate={(option) => {
          const dotColor = option.color || 'var(--text-muted)';
          return (
            <div className="flex items-center gap-2.5">
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0" 
                style={{ background: dotColor, boxShadow: `0 0 4px ${dotColor}44` }} 
              />
              <span>{option.name || option.label}</span>
            </div>
          );
        }}
        valueTemplate={(option, props) => {
          if (!option) return <span>{props.placeholder}</span>;
          const fullOption = options.find(o => o.id === (typeof option === 'object' ? option.id : option));
          const opt = fullOption || option;
          const dotColor = opt.color || 'var(--text-muted)';
          return (
            <div className="flex items-center gap-2.5">
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0" 
                style={{ background: dotColor, boxShadow: `0 0 4px ${dotColor}44` }} 
              />
              <span className="truncate">{opt.name || opt.label}</span>
            </div>
          );
        }}
        placeholder={isLoading ? 'Loading...' : placeholder}
        disabled={disabled || isLoading}
        className="w-full h-full"
        style={{ border: 'none', boxShadow: 'none', background: 'transparent', height: '44px' }}
        pt={{
          root: { style: { border: 'none', boxShadow: 'none', background: 'transparent', width: '100%', height: '44px' } },
          input: {
            className: 'text-[13px] font-medium text-slate-800 dark:text-white',
            style: { border: 'none', boxShadow: 'none', background: 'transparent', padding: '0 0 0 16px', display: 'flex', alignItems: 'center', height: '44px' }
          },
          trigger: { className: 'text-slate-400 dark:text-slate-500', style: { border: 'none', background: 'transparent', width: '40px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
          panel: { className: 'rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden', style: { marginTop: '4px' } },
          list: { className: 'p-1.5 flex flex-col gap-0.5' },
          item: { className: 'rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors' },
          emptyMessage: { className: 'px-3 py-4 text-[12px] text-slate-400 text-center' },
        }}
      />
    </div>
  );
};
