import React from 'react';
import { Card } from '@/components/layout/Card';
import { FormField } from '@/components/forms/FormField';
import { TextInput } from '@/components/forms/TextInput';
import { Button } from '@/components/forms/Button';
import ServerSearchDropdown from '@/components/core/ServerSearchDropdown';
import { Plus, Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Controller, useFieldArray, Control, UseFormRegister, UseFormSetValue, useWatch } from 'react-hook-form';
import { ConfirmPopup, confirmPopup } from 'primereact/confirmpopup';

export interface WeeklyMatrixFormProps {
  control: Control<any>;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  days: Date[];
  onDateShift: (direction: 'prev' | 'next') => void;
  errors: any;
}

const extractId = (val: any) => (val && typeof val === 'object' ? val.id : val);


export function WeeklyMatrixForm({ control, register, setValue, days, onDateShift, errors }: WeeklyMatrixFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'logs',
  });

  const formValues = useWatch({ control, name: 'logs' }) || [];

  const getDayTotal = (dayIndex: number) => {
    return formValues.reduce((sum: number, row: any) => sum + Number(row?.hours?.[dayIndex] || 0), 0);
  };

  const getRowTotal = (rowIndex: number) => {
    return (formValues[rowIndex]?.hours || []).reduce((sum: number, h: number) => sum + Number(h || 0), 0);
  };

  const grandTotal = formValues.reduce((sum: number, row: any) => {
    return sum + (row?.hours || []).reduce((rowSum: number, h: number) => rowSum + Number(h || 0), 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div
          className="flex items-center gap-2 p-1.5 rounded-2xl shadow-sm"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
        >
          <Button
            unstyled
            type="Button"
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            onClick={() => onDateShift('prev')}
          >
            <ChevronLeft size={16} />
          </Button>
          <div
            className="px-6 py-2 rounded-xl font-bold text-[13px] flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <CalendarIcon size={15} style={{ color: 'var(--primary)' }} />
            {days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            <span className="text-slate-400 font-normal mx-1">—</span>
            {days[days.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <Button
            unstyled
            type="Button"
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            onClick={() => onDateShift('next')}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
        style={{ border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}
      >
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1000px]" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                <th className="text-left py-3 px-5 text-[11px] font-extrabold uppercase tracking-widest w-[22%] min-w-[200px]" style={{ color: 'var(--text-muted)' }}>Project <span className="text-rose-500 text-[13px] ml-0.5">*</span></th>
                <th className="text-left py-3 px-3 text-[11px] font-extrabold uppercase tracking-widest w-[22%] min-w-[200px]" style={{ color: 'var(--text-muted)' }}>Task / Bug <span className="text-rose-500 text-[13px] ml-0.5">*</span></th>
                {days.map((d, i) => {
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <th key={i} className="text-center py-3 px-2 w-[72px] min-w-[72px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: isWeekend ? '#ef4444' : 'var(--text-muted)' }}>
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]}
                        </span>
                        <span className="text-[13px] font-black" style={{ color: 'var(--text-primary)' }}>
                          {d.getDate()}
                        </span>
                      </div>
                    </th>
                  );
                })}
                <th className="w-[85px] min-w-[85px] text-center text-[11px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Total</th>
                <th className="w-[50px] min-w-[50px] text-center text-[11px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {fields.length === 0 && (
                <tr>
                  <td colSpan={days.length + 3} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-2xl">
                        ⏳
                      </div>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No Time Entries</p>
                      <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
                        Click the "Add New Row" Button below to start logging your hours for this week.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {fields.map((field, index) => (
                <tr
                  key={field.id}
                  className="group/row transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                  <td className="p-3 align-top">
                    <FormField label="" error={errors.logs?.[index]?.project?.message}>
                      <Controller
                        name={`logs.${index}.project`}
                        control={control}
                        render={({ field: dField }) => (
                          <ServerSearchDropdown
                            entityType="projects"
                            placeholder="Select Project"
                            value={dField.value}
                            onChange={(v) => {
                              dField.onChange(v);
                              setValue(`logs.${index}.task`, null);
                            }}
                            className="w-full"
                          />
                        )}
                      />
                    </FormField>
                  </td>
                  <td className="p-3 align-top">
                    <Controller
                      name={`logs.${index}.project`}
                      control={control}
                      render={({ field: pField }) => {
                        const projectId = extractId(pField.value);
                        return (
                          <FormField label="" error={errors.logs?.[index]?.task?.message}>
                            <Controller
                              name={`logs.${index}.task`}
                              control={control}
                              render={({ field: tField }) => (
                                <ServerSearchDropdown
                                  entityType="workitems"
                                  endpoint="/search/work-items"
                                  field="name"
                                  project_id={projectId}
                                  placeholder="Select Task/Bug…"
                                  value={tField.value}
                                  onChange={tField.onChange}
                                  disabled={!projectId}
                                  className="w-full"
                                />
                              )}
                            />
                          </FormField>
                        );
                      }}
                    />
                  </td>
                  {days.map((d, dayIndex) => {
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <td key={dayIndex} className="p-3 align-top w-[72px] min-w-[72px]" style={{ background: isWeekend ? 'rgba(0,0,0,0.015)' : 'transparent' }}>
                        <FormField label="" error={errors.logs?.[index]?.hours?.[dayIndex]?.message}>
                          <TextInput
                            type="number"
                            step="0.5"
                            min="0"
                            max="24"
                            {...register(`logs.${index}.hours.${dayIndex}`)}
                            className="w-full text-center mx-auto tabular-nums font-black text-[13px] transition-all"
                            style={{
                              background: 'var(--input-bg)',
                              border: '1px solid var(--input-border)',
                              borderRadius: '8px',
                              color: 'var(--text-primary)',
                              height: '36px',
                              padding: '0 4px',
                              maxWidth: '100%'
                            }}
                          />
                        </FormField>
                      </td>
                    );
                  })}
                  <td className="p-3 align-middle text-center w-[85px] min-w-[85px] overflow-hidden">
                    <div className="font-extrabold text-[14px] tabular-nums truncate" title={getRowTotal(index).toFixed(1)} style={{ color: 'var(--text-primary)' }}>
                      {getRowTotal(index).toFixed(1)}<span className="text-[11px] ml-0.5 text-slate-400">h</span>
                    </div>
                  </td>
                  <td className="p-3 align-middle text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="!w-8 !h-8 !p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover/row:opacity-100 transition-all disabled:opacity-0"
                      onClick={(e) => {
                        confirmPopup({
                          target: e.currentTarget as HTMLElement,
                          message: 'Remove this row?',
                          icon: 'pi pi-exclamation-triangle',
                          acceptClassName: 'p-Button-danger rounded-lg',
                          accept: () => remove(index),
                        });
                      }}
                      disabled={fields.length === 1}
                      title="Remove Row"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="p-4 text-right font-extrabold text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Weekly Totals
                </td>
                {days.map((_, i) => (
                  <td key={i} className="p-4 text-center w-[72px] min-w-[72px] overflow-hidden">
                    <span className="font-extrabold text-[13px] tabular-nums truncate block w-full" title={getDayTotal(i).toFixed(1)} style={{ color: 'var(--primary)' }}>
                      {getDayTotal(i).toFixed(1)}
                    </span>
                  </td>
                ))}
                <td className="p-4 text-center w-[85px] min-w-[85px] overflow-hidden">
                  <div
                    className="font-black text-[14px] px-1 py-1.5 rounded-lg tabular-nums shadow-sm truncate"
                    title={grandTotal.toFixed(1)}
                    style={{
                      background: 'linear-gradient(135deg, #B3F57B 0%, #0CD1C3 100%)',
                      color: '#0f172a',
                    }}
                  >
                    {grandTotal.toFixed(1)}<span className="text-[10px] opacity-70 ml-0.5">h</span>
                  </div>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div
          className="p-4 flex justify-start"
          style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => append({ project: null, task: null, hours: Array(days.length).fill(0) })}
            className="!h-9"
          >
            <Plus size={14} /> Add Row
          </Button>
        </div>
      </div>
      <ConfirmPopup />
    </div>
  );
}
