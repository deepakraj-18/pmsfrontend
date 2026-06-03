import React, { useState, useCallback, useEffect } from 'react';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primereact/autocomplete';
import { api } from '@/api/client';
import { useDebounce } from '@/hooks/useDebounce';

export interface UserOption {
  id: string;
  displayName: string;
  mail: string | null;
}

interface UserMultiSelectProps {
  value: UserOption[];
  onChange: (users: UserOption[]) => void;
  placeholder?: string;
  className?: string;

  useLocalSearch?: boolean;
}

export const UserMultiSelect: React.FC<UserMultiSelectProps> = ({
  value,
  onChange,
  placeholder = 'Search organisation users...',
  className,
  useLocalSearch = false,
}) => {
  const [suggestions, setSuggestions] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [localVal, setLocalVal] = useState<UserOption[]>([]);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const normValue: UserOption[] = React.useMemo(() => {
    return (value ?? []).map((v: any) => {
      if (typeof v === 'string') return { id: v, displayName: v, mail: v };
      if (v.displayName) return v as UserOption;
      const displayName = [v.first_name, v.last_name].filter(Boolean).join(' ') || v.email || 'Unknown User';
      return {
        id: String(v.id ?? v.o365_id ?? ''),
        displayName,
        mail: v.email ?? v.mail ?? null,
      };
    });
  }, [value]);

  useEffect(() => {
    setLocalVal(normValue);
  }, [normValue]);

  const search = useCallback(
    async (q: string, selectedIds: string[]) => {
      if (q.length < 2) { setSuggestions([]); return; }
      setLoading(true);
      try {
        let all: UserOption[] = [];
        
        // Search local DB users via /users/search
        const localRes = await api.get('/users/search', { params: { q, limit: 20 } });
        const localUsers = (localRes.data || []).map((u: any) => ({
          id: String(u.id),
          displayName: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email,
          mail: u.email ?? null,
        }));

        if (useLocalSearch) {
          all = localUsers;
        } else {
          try {
            const azureRes = await api.get('/graph/search-users', { params: { q } });
            const azureUsers = (azureRes.data || []) as UserOption[];
            
            // Merge and deduplicate
            const seenMails = new Set(localUsers.map(u => u.mail?.toLowerCase()).filter(Boolean));
            const seenIds = new Set(localUsers.map(u => u.id));
            
            all = [
              ...localUsers,
              ...azureUsers.filter(u => 
                !seenIds.has(u.id) && 
                (!u.mail || !seenMails.has(u.mail.toLowerCase()))
              )
            ];
          } catch (err) {
            console.error("Azure search failed", err);
            all = localUsers;
          }
        }

        setSuggestions(all.filter(u => !selectedIds.includes(u.id) && !selectedIds.includes(u.mail ?? '')));
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [useLocalSearch],
  );

  useEffect(() => {
    search(debouncedQuery, localVal.map(v => v.id));
  }, [debouncedQuery, search]);

  const completeMethod = (event: AutoCompleteCompleteEvent) => {
    setQuery(event.query);
  };

  const handleChange = (e: { value: any }) => {
    const newVal = e.value as UserOption[];
    setLocalVal(newVal);
    onChange(newVal);
  };

  const itemTemplate = (u: UserOption) => {
    return (
      <div className="flex items-center gap-3 py-1">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 text-white flex items-center justify-center font-black text-[11px] flex-shrink-0">
          {u.displayName?.[0] ?? '?'}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[13px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {u.displayName}
          </span>
          <span className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
            {u.mail ?? 'No email'}
          </span>
        </div>
      </div>
    );
  };

  const selectedItemTemplate = (u: UserOption) => {
    return (
      <div className="flex items-center gap-1.5 px-1 py-0.5">
        <span className="w-4 h-4 rounded-full bg-gradient-to-br from-teal-400 to-indigo-500 text-white text-[9px] flex items-center justify-center font-black flex-shrink-0">
          {u.displayName?.[0] ?? '?'}
        </span>
        <span className="max-w-[130px] truncate text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>
          {u.displayName}
        </span>
      </div>
    );
  };

  return (
    <div className={`form-field-shell relative ${className ?? ''}`}>
      <AutoComplete
        multiple
        value={localVal}
        suggestions={suggestions}
        completeMethod={completeMethod}
        field="displayName"
        itemTemplate={itemTemplate}
        selectedItemTemplate={selectedItemTemplate}
        onChange={handleChange}
        placeholder={localVal.length === 0 ? placeholder : 'Add more...'}
        className="w-full h-full"
        inputClassName="text-[13px] outline-none bg-transparent border-none shadow-none h-full"
        inputStyle={{ color: 'var(--text-primary)' }}
        panelClassName="overflow-hidden shadow-2xl rounded-xl mt-1.5"
        panelStyle={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
        }}
        emptyMessage={loading ? 'Searching…' : 'No users found'}
        pt={{
          root: { className: 'w-full h-full border-none shadow-none bg-transparent' },
          container: {
            className: 'min-h-[44px] max-h-[250px] overflow-y-auto flex flex-wrap gap-2 items-center px-3 py-2 transition-all !border-none !shadow-none bg-transparent custom-scrollbar',
            style: { border: 'none', boxShadow: 'none' }
          },
          token: {
            className: 'bg-teal-50/50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full border border-teal-200 dark:border-teal-800/60 shadow-sm'
          },
          tokenLabel: { className: 'p-0' },
          list: { className: 'p-1.5 flex flex-col gap-0.5' },
          item: {
            className: 'rounded-lg px-3 py-2.5 cursor-pointer transition-colors hover:!bg-teal-50 dark:hover:!bg-teal-900/20 text-[13px]',
            style: { color: 'var(--text-primary)' },
          },
        }}
      />
    </div>
  );
};
