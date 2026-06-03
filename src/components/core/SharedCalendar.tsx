import React from 'react';
import { Calendar } from 'primereact/calendar';
import { cn } from '@/utils/cn';

interface SharedCalendarProps {
  value?: Date | null;
  onChange: (value: Date | null | undefined) => void;
  disableFuture?: boolean;
  placeholder?: string;
  className?: string;
  [key: string]: any;
}

const SharedCalendar: React.FC<SharedCalendarProps> = ({
  value,
  onChange,
  disableFuture = false,
  placeholder = 'Select Date',
  className,
  ...props
}) => {
  const maxDate = disableFuture ? new Date() : undefined;

  return (
    <div className={cn('w-full flex flex-col', className)}>
      <Calendar
        {...props}
        value={value ?? undefined}
        onChange={(e) => onChange(e.value as Date | null | undefined)}
        maxDate={maxDate}
        placeholder={placeholder}
        showIcon
        className="w-full p-calendar-w-btn"
        inputClassName="w-full text-sm py-2 px-3"
        panelClassName="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-lg mt-1"
      />
    </div>
  );
};

export default SharedCalendar;
