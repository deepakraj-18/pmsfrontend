import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { availablePermissions, Permission } from '../../types/permissions';

interface RolePermissionGridProps {
  permissions: Record<string, any>;
  onChangePermission: (id: string, value: any) => void;
  onToggleAllInCategory: (category: string, perms: Permission[]) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Projects': 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50',
  'Tasks': 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/50',
  'Issues': 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/50',
  'Milestones': 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800/50',
  'Time Tracking': 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50',
  'Users': 'bg-cyan-50 border-cyan-200 dark:bg-cyan-950/30 dark:border-cyan-800/50',
  'Teams': 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800/50',
  'Reports': 'bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-800/50',
  'Administration': 'bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/50',
};

export function RolePermissionGrid({ permissions, onChangePermission, onToggleAllInCategory }: RolePermissionGridProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.keys(CATEGORY_COLORS)));

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const s = new Set(prev);
      s.has(category) ? s.delete(category) : s.add(category);
      return s;
    });
  };

  const groupedPermissions = availablePermissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedPermissions).map(([category, perms]) => {
        const isExpanded = expandedCategories.has(category);
        const selectedCount = perms.filter(p => !!permissions[p.id]).length;
        const allSelected = selectedCount === perms.length;
        const colorCls = CATEGORY_COLORS[category] || 'bg-gray-50 border-gray-200';

        return (
          <div key={category} className={`border rounded-lg overflow-hidden ${colorCls}`}>
            <div
              className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => toggleCategory(category)}
            >
              <div className="flex items-center gap-2">
                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200">{category}</span>
                <span className="text-[11px] bg-white/60 dark:bg-black/20 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                  {selectedCount}/{perms.length}
                </span>
              </div>
              <Button
                text
                type="Button"
                onClick={(e) => { e.stopPropagation(); onToggleAllInCategory(category, perms); }}
                className="!text-[12px] font-bold !text-brand-teal-600 hover:!text-brand-teal-700 transition-colors uppercase tracking-wider"
                label={allSelected ? 'Deselect All' : 'Select All'}
              />
            </div>

            {isExpanded && (
              <div className="px-4 pb-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {perms.map(permission => {
                  const val = permissions[permission.id];
                  const hasValue = !!val;
                  const isViewPermission = permission.id.endsWith('-view');

                  return (
                    <label
                      key={permission.id}
                      className={`flex flex-col gap-1.5 p-3 rounded-lg cursor-pointer border transition-all ${hasValue
                          ? 'bg-white dark:bg-slate-800 border-brand-teal-500 dark:border-brand-teal-500/50 shadow-sm ring-1 ring-brand-teal-500/10'
                          : 'bg-white/40 dark:bg-black/10 border-transparent hover:bg-white hover:border-slate-200'
                        }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {!isViewPermission && (
                          <Checkbox
                            checked={hasValue}
                            onChange={() => onChangePermission(permission.id, !hasValue)}
                            className="mt-0.5"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="block text-[13px] font-bold text-slate-700 dark:text-slate-200 truncate">{permission.name}</span>
                          <span className="block text-[11px] text-slate-500 leading-tight mt-0.5">{permission.description}</span>
                        </div>
                      </div>
                      
                      {isViewPermission && (
                         <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                           <Dropdown
                              value={val === true ? 'All' : (val || '')}
                              options={[
                                { label: '-', value: '' },
                                { label: 'O', value: 'O' },
                                { label: 'A', value: 'A' },
                                { label: 'ALL', value: 'All' }
                              ]}
                              onChange={(e) => {
                                const newVal = e.value;
                                onChangePermission(permission.id, newVal === '' ? false : newVal);
                              }}
                              unstyled
                              pt={{
                                root: { className: 'inline-flex items-center w-[64px] h-[26px] bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-teal-400 rounded-md text-[11px] font-bold outline-none transition-all cursor-pointer relative' },
                                input: { className: 'flex-1 w-full text-center pl-1 text-slate-700 dark:text-slate-300 select-none' },
                                trigger: { className: 'w-5 h-full flex items-center justify-center text-slate-400 border-l-2 border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 rounded-r-md shrink-0' },
                                panel: { className: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg overflow-hidden z-50 min-w-[64px]' },
                                list: { className: 'py-1 flex flex-col m-0 p-0 list-none' },
                                item: { className: 'text-[11px] font-bold px-2 py-1.5 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-400 cursor-pointer text-center select-none transition-colors' }
                              }}
                           />
                         </div>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
