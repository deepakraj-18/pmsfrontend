import React, { useState, useEffect } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { api } from '@/api/client';

interface ServerLookupDropdownProps {
  category: string;
  value: any;
  onChange: (val: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const lookupCache: Record<string, Promise<any>> = {};

export function ServerLookupDropdown({
  category,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  disabled,
}: ServerLookupDropdownProps) {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchLookups = async () => {
      setLoading(true);
      try {
        if (!lookupCache[category]) {
          lookupCache[category] = api.get(`/masters/lookups/${category}`).then(res => res.data || []);
        }
        const data = await lookupCache[category];
        if (!cancelled) setOptions(data);
      } catch (err) {
        console.error(`Failed to fetch lookups for ${category}:`, err);
        delete lookupCache[category];
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchLookups();
    return () => { cancelled = true; };
  }, [category]);

  const processedOptions = options.map(o => ({
    ...o,
    label: o.label || o.name || o.value || String(o.id)
  }));

  const currentId: number | null = (() => {
    if (!value) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value?.id != null) return Number(value.id);
    if (typeof value === 'string') {
      if (!isNaN(Number(value))) return Number(value);
      const match = processedOptions.find((o) => 
        String(o.value || '').toLowerCase() === value.toLowerCase() || 
        String(o.label || '').toLowerCase() === value.toLowerCase() || 
        String(o.name || '').toLowerCase() === value.toLowerCase()
      );
      if (match) return match.id;
    }
    return null;
  })();

  const itemTemplate = (option: any) => {
    const dotColor = option.color || 'var(--text-muted)';
    return (
      <div className="flex items-center gap-2.5">
        <div 
          className="w-2 h-2 rounded-full flex-shrink-0" 
          style={{ background: dotColor, boxShadow: `0 0 4px ${dotColor}44` }} 
        />
        <span>{option.label}</span>
      </div>
    );
  };

  const valueTemplate = (option: any, props: any) => {
    if (!option) return <span>{props.placeholder}</span>;
    const dotColor = option.color || 'var(--text-muted)';
    return (
      <div className="flex items-center gap-2.5">
        <div 
          className="w-2 h-2 rounded-full flex-shrink-0" 
          style={{ background: dotColor, boxShadow: `0 0 4px ${dotColor}44` }} 
        />
        <span className="truncate">{option.label}</span>
      </div>
    );
  };

  return (
    <div
      className={`form-field-shell ${className}`}
    >
      <Dropdown
        value={currentId}
        options={processedOptions}
        optionLabel="label"
        optionValue="id"
        itemTemplate={itemTemplate}
        valueTemplate={valueTemplate}
        onChange={(e) => {
          const found = processedOptions.find(o => o.id === e.value) || null;
          onChange(found);
        }}
        placeholder={loading ? 'Loading...' : placeholder}
        disabled={disabled || loading}
        className="w-full h-full"
        style={{ border: 'none', boxShadow: 'none', background: 'transparent', height: '44px', color: 'var(--text-primary)' }}
        pt={{
          root: { style: { border: 'none', boxShadow: 'none', background: 'transparent', width: '100%', height: '44px' } },
          input: {
            className: 'text-[13px] font-medium',
            style: { border: 'none', boxShadow: 'none', background: 'transparent', padding: '0 0 0 16px', display: 'flex', alignItems: 'center', height: '44px', color: 'var(--text-primary)' }
          },
          trigger: { className: 'text-slate-400 dark:text-slate-500', style: { border: 'none', background: 'transparent', width: '40px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
          panel: { className: 'rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden', style: { marginTop: '4px' } },
          list: { className: 'p-1.5 flex flex-col gap-0.5', style: {} },
          item: { className: 'rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors' },
          emptyMessage: { className: 'px-3 py-4 text-[12px] text-slate-400 text-center' },
        }}
      />
    </div>
  );
}
