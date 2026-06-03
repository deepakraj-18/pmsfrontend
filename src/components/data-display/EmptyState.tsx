import React from 'react';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center">
    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
      {icon}
    </div>
    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{title}</h3>
    <p className="text-xs font-medium text-slate-500 mb-4">{description}</p>
    {action}
  </div>
);
