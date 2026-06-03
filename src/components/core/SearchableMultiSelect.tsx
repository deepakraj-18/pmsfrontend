import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect';
import { api } from '@/api/client';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchableMultiSelectProps {
  entityType: string;
  value: any[];
  onChange: (value: any[]) => void;
  placeholder?: string;
  field?: string;
  filters?: Record<string, any>;
  itemTemplate?: (item: any) => React.ReactNode;
  disabled?: boolean;
  customSearchPath?: string | null;
  [key: string]: any;
}

const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  entityType,
  value = [],
  onChange,
  placeholder = 'Search and select...',
  field = 'name',
  filters = {},
  itemTemplate,
  disabled = false,
  customSearchPath = null,
  ...props
}) => {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const debouncedFilter = useDebounce(filterQuery, 350);

  const valueRef = useRef(value);
  valueRef.current = value;

  const mergeWithSelected = useCallback((newItems: any[]): any[] => {
    const idSet = new Set(newItems.map((o: any) => o?.id));
    const extras = (valueRef.current || []).filter((v: any) => v?.id && !idSet.has(v.id));
    return [...extras, ...newItems];
  }, []);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    try {

      const basePath = entityType.includes('/') ? `/${entityType}` : `/${entityType}/`;
      const response = await api.get(basePath, { params: { limit: 100, ...filters } });
      const data = response.data;
      const items = Array.isArray(data) ? data : (data?.items ?? []);
      setOptions(mergeWithSelected(items));
    } catch (err) {
      console.error(`Failed to fetch initial ${entityType}`, err);
    } finally {
      setLoading(false);
    }
  }, [entityType, JSON.stringify(filters)]);

  const performSearch = useCallback(
    async (query: string, currentFilters: Record<string, any>, path: string | null) => {
      if (!query?.trim()) {
        fetchInitial();
        return;
      }
      setLoading(true);
      try {
        const searchPath = path ?? `/${entityType}/search`;
        const response = await api.get(searchPath, { params: { q: query, ...currentFilters } });
        const results = response.data;
        const items = Array.isArray(results) ? results : (results?.items ?? []);
        setOptions(mergeWithSelected(items));
      } catch (err) {
        console.error(`Search failed for ${entityType}`, err);
      } finally {
        setLoading(false);
      }
    },
    [entityType, fetchInitial, mergeWithSelected]
  );

  useEffect(() => {
    performSearch(debouncedFilter, filters, customSearchPath);
  }, [debouncedFilter, filters, customSearchPath, performSearch]);

  useEffect(() => {
    fetchInitial();
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    if (value && value.length > 0) {
      setOptions(prev => {
        const existingIds = new Set(prev.map((o: any) => o?.id));
        const toAdd = value.filter((v: any) => v?.id && !existingIds.has(v.id));
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
      });
    }
  }, [JSON.stringify(value?.map((v: any) => v?.id))]);

  return (
    <div className="relative w-full group">
      <MultiSelect
        {...props}
        value={value}
        options={options}
        onChange={(e: MultiSelectChangeEvent) => onChange(e.value)}
        optionLabel={field}
        placeholder={placeholder}
        filter
        filterPlaceholder="Type to search..."
        onFilter={(e) => setFilterQuery(e.filter)}
        loading={loading}
        disabled={disabled}
        itemTemplate={itemTemplate}
        display="chip"
        showSelectAll={false}
        maxSelectedLabels={4}
        className="w-full text-[13px] font-medium transition-all"
        panelClassName="custom-auto-overlay overflow-hidden shadow-2xl rounded-xl mt-1.5 border border-theme-border bg-theme-surface backdrop-blur-md"
        emptyFilterMessage="No results found"
        emptyMessage={loading ? 'Loading...' : 'No options available'}
        pt={{
          list: { className: 'p-1.5 flex flex-col gap-1' },
          item: { className: 'rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer overflow-hidden transition-all' }
        }}
      />
    </div>
  );
};

export default SearchableMultiSelect;
