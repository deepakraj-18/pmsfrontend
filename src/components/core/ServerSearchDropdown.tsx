import React, { useState, useCallback, useRef } from 'react';
import { AutoComplete, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primereact/autocomplete';
import { api } from '@/api/client';
import { useDebounce } from '@/hooks/useDebounce';

interface ServerSearchDropdownProps {
  entityType: string;
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  field?: string;
  dropdown?: boolean;
  filters?: Record<string, any>;
  itemTemplate?: (item: any) => React.ReactNode;
  disabled?: boolean;
  customSearchPath?: string | null;
  allowedValues?: string[];
  [key: string]: any;
}


const ENTITY_FIELD_MAP: Record<string, string> = {
  lookups: 'label',
  projects: 'project_name',
  milestones: 'milestone_name',
  tasks: 'task_name',
  issues: 'bug_name',
  workitems: 'name',
  teams: 'name',
  tasklists: 'name',
  users: 'name',
};


function getItemLabel(item: any, finalField: string): string {
  if (!item) return '';
  if (typeof item === 'string') return item;
  const label = (
    item[finalField] ||
    item.project_name ||
    item.milestone_name ||
    item.task_name ||
    item.bug_name ||
    item.title ||
    item.name ||
    item.label ||
    ''
  );
  return label.replace(/^\[(?:Issue|Task)\]\s*/i, '');
}

const ServerSearchDropdown: React.FC<ServerSearchDropdownProps> = ({
  entityType,
  value,
  onChange,
  placeholder = 'Search...',
  field = 'name',
  dropdown = true,
  filters = {},
  itemTemplate,
  disabled = false,
  customSearchPath = null,
  endpoint = null,
  allowedValues,
  project_id,
  className = '',
  ...props
}) => {

  const entityKey = Object.keys(ENTITY_FIELD_MAP).find(k => entityType.toLowerCase().includes(k));
  const finalField = entityKey ? ENTITY_FIELD_MAP[entityKey] : (field || 'name');

  const isProject = entityType.toLowerCase().includes('projects');


  const { field: _droppedField, ...safeProps } = props;

  const actualSearchPath = endpoint || customSearchPath;
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [internalValue, setInternalValue] = useState<any>(value);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const combinedFilters = React.useMemo(() => {
    const f = { ...filters };
    if (project_id) f.project_id = project_id;
    return f;
  }, [JSON.stringify(filters), project_id]);

  const didFetch = useRef(false);



  React.useEffect(() => {

    if (!value && !internalValue) return;


    if (value === internalValue) return;
    if (value && internalValue && value.id === internalValue.id) return;

    if (value && typeof value === 'object') {
      const label = value[finalField] || '';
      if (typeof label === 'string' && label.match(/^\[(?:Issue|Task)\]\s*/i)) {
        setInternalValue({ ...value, [finalField]: label.replace(/^\[(?:Issue|Task)\]\s*/i, '') });
        return;
      }
    }
    setInternalValue(value);
  }, [value, finalField]);


  React.useEffect(() => {
    didFetch.current = false;
    setSuggestions([]);
  }, [project_id]);

  const fetchInitial = useCallback(async () => {
    setLoading(true);
    try {
      const basePath = actualSearchPath
        ? actualSearchPath
        : entityType.includes('/')
          ? `/${entityType}`
          : `/${entityType}/`;
      const extraParams: Record<string, any> = { limit: 100, ...combinedFilters };
      if (isProject) extraParams.include_all = true;
      const response = await api.get(basePath, { params: extraParams });
      const data = response.data;
      let items = Array.isArray(data) ? data : (data?.items ?? []);
      if (allowedValues && allowedValues.length > 0) {
        items = items.filter(item => allowedValues.includes(item[finalField]));
      }

      const itemsWithCleanLabels = items.map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          const rawLabel = item[finalField] || '';
          if (rawLabel.match(/^\[(?:Issue|Task)\]\s*/i)) {
            return { ...item, [finalField]: rawLabel.replace(/^\[(?:Issue|Task)\]\s*/i, '') };
          }
        }
        return item;
      });

      const uniqueItems = [];
      const seenIds = new Set();
      for (const item of itemsWithCleanLabels) {
        if (item.id !== undefined) {
          const key = item.type ? `${item.type}-${item.id}` : item.id;
          if (!seenIds.has(key)) {
            seenIds.add(key);
            uniqueItems.push(item);
          }
        } else {
          uniqueItems.push(item);
        }
      }
      
      setSuggestions(uniqueItems);
      didFetch.current = true;
    } catch (err) {
      console.error(`Failed to fetch initial ${entityType}`, err);
    } finally {
      setLoading(false);
    }
  }, [entityType, isProject, JSON.stringify(combinedFilters), allowedValues, finalField, actualSearchPath]);

  const performSearch = useCallback(
    async (q: string, currentFilters: Record<string, any>, path: string | null) => {
      setLoading(true);
      try {
        const searchUrl = path || actualSearchPath || `/${entityType}/search`;
        const searchParams = { q, ...currentFilters, limit: 100 };
        const response = await api.get(searchUrl, { params: searchParams });
        const result = response.data;
        let items = Array.isArray(result) ? result : (result?.items ?? []);
        if (allowedValues && allowedValues.length > 0) {
          items = items.filter(item => allowedValues.includes(item[finalField]));
        }

        const itemsWithCleanLabels = items.map((item: any) => {
          if (typeof item === 'object' && item !== null) {
            const rawLabel = item[finalField] || '';
            if (rawLabel.match(/^\[(?:Issue|Task)\]\s*/i)) {
              return { ...item, [finalField]: rawLabel.replace(/^\[(?:Issue|Task)\]\s*/i, '') };
            }
          }
          return item;
        });

        const uniqueItems = [];
        const seenIds = new Set();
        for (const item of itemsWithCleanLabels) {
          if (item.id !== undefined) {
            const key = item.type ? `${item.type}-${item.id}` : item.id;
            if (!seenIds.has(key)) {
              seenIds.add(key);
              uniqueItems.push(item);
            }
          } else {
            uniqueItems.push(item);
          }
        }

        setSuggestions(uniqueItems);
      } catch (err) {
        console.error(`Search failed for ${entityType}`, err);
      } finally {
        setLoading(false);
      }
    },
    [entityType, actualSearchPath, finalField, allowedValues]
  );

  React.useEffect(() => {
    if (query.trim().length === 0) return;
    performSearch(debouncedQuery, combinedFilters, customSearchPath);
  }, [debouncedQuery, combinedFilters, customSearchPath, performSearch]);

  const defaultItemTemplate = (item: any) => {
    if (item && (item.type === 'task' || item.type === 'issue')) {
      const isIssue = item.type === 'issue';
      return (
        <div className="flex items-center gap-2 py-0.5">
          <span className={`text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded ${isIssue ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400' : 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400'}`}>
            {isIssue ? 'DEFECT' : 'TASK'}
          </span>
          <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
            {getItemLabel(item, finalField)}
          </span>
        </div>
      );
    }
    return (
      <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
        {getItemLabel(item, finalField)}
      </span>
    );
  };

  const onSearch = (event: AutoCompleteCompleteEvent) => {
    if (event.query.trim().length === 0) {
      setQuery('');
      fetchInitial();
    } else {
      setQuery(event.query);
    }
  };

  const onSelect = (event: AutoCompleteSelectEvent) => {
    const selected = event.value;
    setInternalValue(selected);
    onChange(selected);
  };

  const onInternalChange = (e: any) => {
    setInternalValue(e.value);

    if (!e.value || (typeof e.value === 'string' && !e.value.trim())) {
      onChange(null);
    }
  };

  return (
    <div className={`form-field-shell ${className}`}>
      <AutoComplete
        {...safeProps}
        dropdown={dropdown}
        field={finalField}
        value={internalValue}
        suggestions={suggestions}
        completeMethod={onSearch}
        onFocus={() => {
          if (!didFetch.current) fetchInitial();
          else if (!suggestions.length) fetchInitial();
        }}
        onDropdownClick={() => { fetchInitial(); }}
        onSelect={onSelect}
        onChange={onInternalChange}
        onClear={() => {
          setInternalValue('');
          onChange(null);
          setSuggestions([]);
          didFetch.current = false;
        }}
        placeholder={placeholder}
        disabled={disabled}
        itemTemplate={itemTemplate || defaultItemTemplate}
        tooltip={internalValue ? getItemLabel(internalValue, finalField) : undefined}
        tooltipOptions={{ position: 'top', showDelay: 500 }}
        className="w-full h-full"
        inputClassName="w-full text-[13px] font-medium h-full px-4 !border-none !shadow-none bg-transparent transition-all outline-none text-ellipsis overflow-hidden whitespace-nowrap"
        style={{ color: 'var(--text-primary)', border: 'none', boxShadow: 'none', background: 'transparent' }}
        panelClassName="overflow-hidden shadow-2xl rounded-xl mt-1.5 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 max-w-[420px]"
        emptyMessage={
          loading
            ? 'Loading...'
            : entityType.toLowerCase().includes('milestone')
              ? 'No milestones found for this project.'
              : 'No results found'
        }
        forceSelection={false}
        pt={{
          root: { style: { border: 'none', boxShadow: 'none', background: 'transparent', width: '100%', height: '44px' } },
          input: {
            className: 'text-[13px] font-medium !border-none !shadow-none',
            style: { border: 'none', boxShadow: 'none', background: 'transparent', padding: '0 0 0 16px', display: 'flex', alignItems: 'center', height: '44px', color: 'var(--text-primary)' }
          },
          list: { className: 'p-1.5 flex flex-col gap-0.5' },
          item: { className: 'rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors text-slate-800 dark:text-slate-200 text-[13px]' },
          dropdownButton: {
            root: {
              className: 'bg-transparent border-none text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors',
              style: { border: 'none', background: 'transparent', width: '40px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
            }
          }
        }}
      />
    </div>
  );
};

export default ServerSearchDropdown;
