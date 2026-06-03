import React, { useState } from 'react';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Card } from '@/components/layout/Card';
import { Button } from 'primereact/button';
import { CheckboxInput } from '@/components/forms/CheckboxInput';
import { DropdownSelect } from '@/components/forms/DropdownSelect';
import { InputSwitch } from 'primereact/inputswitch';
import { Save } from 'lucide-react';

const notificationCategories = [
  {
    category: 'Projects',
    items: [
      { id: 'proj_created', label: 'New project created', email: true, inApp: true },
      { id: 'proj_updated', label: 'Project status updated', email: true, inApp: true },
      { id: 'proj_assigned', label: 'Assigned to a project', email: true, inApp: true },
      { id: 'proj_milestone', label: 'Milestone achieved', email: false, inApp: true },
    ],
  },
  {
    category: 'Tasks',
    items: [
      { id: 'task_assigned', label: 'Task assigned to me', email: true, inApp: true },
      { id: 'task_updated', label: 'Task status changed', email: false, inApp: true },
      { id: 'task_overdue', label: 'Task is overdue', email: true, inApp: true },
      { id: 'task_completed', label: 'Task marked as complete', email: false, inApp: true },
    ],
  },
  {
    category: 'Issues',
    items: [
      { id: 'issue_created', label: 'New issue reported', email: true, inApp: true },
      { id: 'issue_assigned', label: 'Issue assigned to me', email: true, inApp: true },
      { id: 'issue_updated', label: 'Issue status changed', email: false, inApp: true },
      { id: 'issue_resolved', label: 'Issue resolved', email: false, inApp: true },
    ],
  },
  {
    category: 'Time & Reports',
    items: [
      { id: 'time_reminder', label: 'Daily time log reminder', email: true, inApp: false },
      { id: 'report_generated', label: 'Report generated', email: true, inApp: true },
      { id: 'budget_alert', label: 'Budget threshold alert', email: true, inApp: true },
    ],
  },
];

export function NotificationSettings() {
  const [settings, setSettings] = useState(notificationCategories);

  return (
    <PageLayout
      title="Notification Settings"
      actions={
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Save Preferences
        </Button>
      }
    >
      <div className="space-y-6">
        <Card className="bg-brand-teal-50/50 dark:bg-brand-teal-900/10 border-brand-teal-100 dark:border-brand-teal-900/30">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 text-brand-teal-600 shadow-sm border border-brand-teal-100 dark:border-brand-teal-900/30">
              <Save className="w-5 h-5" />
            </div>
            <p className="text-[14px] font-medium text-brand-teal-900 dark:text-brand-teal-100">
              Configure how you receive notifications for different types of events in the system.
            </p>
          </div>
        </Card>

        {settings.map((section, sectionIndex) => (
          <Card key={sectionIndex} title={section.category}>
            <div className="space-y-1">
              <div className="hidden sm:grid sm:grid-cols-3 gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="col-span-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Notification Type
                </div>
                <div className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Email
                </div>
                <div className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  In-App
                </div>
              </div>

              {section.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-4 items-start sm:items-center py-4 px-2 rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className="col-span-1 text-[14px] font-medium text-slate-700 dark:text-slate-300">
                    {item.label}
                  </div>
                  <div className="flex items-center gap-3 sm:justify-center w-full sm:w-auto pl-1 sm:pl-0">
                    <span className="sm:hidden text-[12px] font-bold text-slate-400 uppercase tracking-wider w-16">Email</span>
                    <CheckboxInput checked={item.email} onChange={() => { }} />
                  </div>
                  <div className="flex items-center gap-3 sm:justify-center w-full sm:w-auto pl-1 sm:pl-0">
                    <span className="sm:hidden text-[12px] font-bold text-slate-400 uppercase tracking-wider w-16">In-App</span>
                    <CheckboxInput checked={item.inApp} onChange={() => { }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}

        <Card title="Notification Frequency">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-2 rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div>
                  <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200">Digest Email</p>
                  <p className="text-[12px] text-slate-500">Receive a summary of all notifications</p>
                </div>
                <DropdownSelect
                  options={[
                    { label: 'Never', value: 'never' },
                    { label: 'Daily', value: 'daily' },
                    { label: 'Weekly', value: 'weekly' },
                  ]}
                  defaultValue="never"
                  className="h-10 w-full sm:w-auto min-w-[140px] mt-2 sm:mt-0 !rounded-xl"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-2 rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <div>
                  <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200">Do Not Disturb</p>
                  <p className="text-[12px] text-slate-500">Pause all notifications during specific hours</p>
                </div>
                <InputSwitch
                  checked={false}
                  onChange={() => { }}
                  pt={{
                    root: { className: 'w-12 h-6' },
                    slider: { className: 'transition-all duration-300 rounded-full' },
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
