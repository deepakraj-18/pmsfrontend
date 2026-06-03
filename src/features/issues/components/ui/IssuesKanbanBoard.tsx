import React from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useNavigate } from 'react-router-dom';
import { Issue } from '../../api/issues.api';
import { AlertCircle, Calendar, GripVertical, Hash } from 'lucide-react';
import { statusStr, statusName } from '@/utils/statusHelpers';

const ITEM_TYPE = 'ISSUE_CARD';
const TEAL = 'hsl(160 60% 45%)';

interface KanbanCardProps {
  issue: Issue;
}

interface KanbanColumnProps {
  status: { id: number; name?: string; label?: string; color?: string };
  issues: Issue[];
  onDrop: (issueId: number, statusName: string) => void;
}

export interface IssuesKanbanBoardProps {
  issues: Issue[];
  statuses: { id: number; name?: string; label?: string; color?: string }[];
  onDrop: (issueId: number, statusName: string) => void;
}

function severityColor(issue: Issue): { bg: string; text: string; dot: string } {
  const s = statusStr(issue.priority ?? issue.severity ?? (issue as any).severity_master);
  if (s === 'critical') return { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' };
  if (s === 'high') return { bg: '#fff7ed', text: '#c2410c', dot: '#f97316' };
  if (s === 'medium') return { bg: '#fefce8', text: '#854d0e', dot: '#eab308' };
  return { bg: '#f0fdf4', text: '#166534', dot: '#22c55e' };
}

function statusColumnColor(name: string): { header: string; border: string; badge: string; badgeText: string } {
  const n = name.toLowerCase();
  if (n.includes('progress') || n.includes('active'))
    return { header: '#3b82f6', border: '#bfdbfe', badge: '#eff6ff', badgeText: '#1d4ed8' };
  if (n.includes('review') || n.includes('test'))
    return { header: '#8b5cf6', border: '#ddd6fe', badge: '#f5f3ff', badgeText: '#6d28d9' };
  if (n.includes('complet') || n.includes('resolv') || n.includes('done'))
    return { header: '#10b981', border: '#a7f3d0', badge: '#ecfdf5', badgeText: '#065f46' };
  if (n.includes('hold') || n.includes('block'))
    return { header: '#f59e0b', border: '#fde68a', badge: '#fffbeb', badgeText: '#92400e' };
  if (n.includes('clos') || n.includes('cancel'))
    return { header: '#6b7280', border: '#e5e7eb', badge: '#f9fafb', badgeText: '#374151' };
  if (n.includes('re-open') || n.includes('reopen'))
    return { header: '#ec4899', border: '#fbcfe8', badge: '#fdf2f8', badgeText: '#9d174d' };
  return { header: TEAL, border: '#99f6e4', badge: '#f0fdfa', badgeText: '#134e4a' };
}

function KanbanCard({ issue }: KanbanCardProps) {
  const navigate = useNavigate();
  const [{ isDragging }, dragRef] = useDrag({
    type: ITEM_TYPE,
    item: { id: issue.id },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const sev = severityColor(issue);
  const assignee = (issue as any).assignees?.[0] ?? issue.assignee;
  const assigneeName = assignee
    ? `${assignee.first_name ?? ''} ${assignee.last_name ?? ''}`.trim()
    : 'Unassigned';
  const assigneeInitials = assignee
    ? `${assignee.first_name?.[0] ?? ''}${assignee.last_name?.[0] ?? ''}`.toUpperCase()
    : '?';

  const severityLabel = statusName((issue as any).severity_master ?? issue.priority ?? issue.severity) || 'Medium';

  return (
    <div
      ref={dragRef as any}
      onClick={() => navigate(`/issues/${issue.id}`)}
      style={{
        opacity: isDragging ? 0.45 : 1,
        transform: isDragging ? 'scale(0.97) rotate(1deg)' : undefined,
        transition: 'all 0.15s ease',
      }}
      className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group ${isDragging ? 'grabbing-cursor' : 'grab-cursor'}`}
    >
      <div className="h-1 rounded-t-2xl" style={{ background: sev.dot }} />

      <div className="p-3.5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${TEAL}18`, color: TEAL }}>
            {(issue as any).public_id ?? `ISS-${issue.id}`}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: sev.bg, color: sev.text }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sev.dot }} />
            {severityLabel}
          </span>
        </div>

        <p className="text-[13px] font-semibold leading-snug text-slate-800 dark:text-slate-100 line-clamp-2 group-hover:text-brand-teal-600 transition-colors">
          {issue.bug_name}
        </p>

        {issue.description && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">
            {issue.description}
          </p>
        )}


        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#0CD1C3,#6366f1)' }}>
              {assigneeInitials}
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[90px]">
              {assigneeName}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
            <Calendar className="w-3 h-3" />
            <span>{(issue as any).due_date ?? issue.end_date ?? '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


function KanbanColumn({ status, issues, onDrop }: KanbanColumnProps) {
  const sName = status.name ?? status.label ?? '';
  const [{ isOver }, dropRef] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: { id: number }) => onDrop(item.id, sName),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  const col = statusColumnColor(sName);

  return (
    <div
      ref={dropRef as any}
      className="flex-shrink-0 flex flex-col"
      style={{
        width: 300,
        minWidth: 300,
        maxWidth: 300,
        height: '100%',
      }}
    >
      <div
        className="flex-shrink-0 rounded-2xl mb-3 px-4 py-3 flex items-center justify-between"
        style={{
          background: `${col.header}14`,
          border: `1.5px solid ${col.border}`,
          transition: 'background 0.2s',
          ...(isOver ? { background: `${col.header}22`, boxShadow: `0 0 0 2px ${col.header}` } : {}),
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: col.header }} />
          <h3 className="font-bold text-[13px] uppercase tracking-wider"
            style={{ color: col.header }}>
            {sName}
          </h3>
        </div>
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: col.badge, color: col.badgeText }}
        >
          {issues.length}
        </span>
      </div>


      <div
        className="flex-1 overflow-y-auto rounded-2xl"
        style={{

          scrollbarWidth: 'thin',
          scrollbarColor: `${col.border} transparent`,

          paddingRight: 4,
          paddingLeft: 2,
          paddingTop: 2,
          paddingBottom: 8,

          ...(isOver ? {
            background: `${col.header}08`,
            borderRadius: '1rem',
          } : {}),
        }}
      >
        <div className="space-y-3 pr-1">
          {issues.map((issue) => (
            <KanbanCard key={issue.id} issue={issue} />
          ))}
          {issues.length === 0 && (
            <div
              className="h-28 rounded-2xl flex flex-col items-center justify-center gap-2 text-[12px] italic"
              style={{
                border: `1.5px dashed ${col.border}`,
                color: col.header,
                opacity: 0.6,
              }}
            >
              <GripVertical size={16} />
              Drop issues here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export function IssuesKanbanBoard({ issues, statuses, onDrop }: IssuesKanbanBoardProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className="flex gap-5 overflow-x-auto h-full"
        style={{
          padding: '6px 8px 12px',

          scrollbarWidth: 'thin',
          scrollbarColor: 'hsl(160 60% 45% / 0.3) transparent',
          alignItems: 'stretch',
        }}
      >
        {statuses.map((s) => {
          const sName = s.name ?? s.label ?? '';
          return (
            <KanbanColumn
              key={s.id}
              status={{ ...s, name: sName }}
              issues={issues.filter((i) => statusStr(i.status) === sName.toLowerCase())}
              onDrop={onDrop}
            />
          );
        })}
      </div>
    </DndProvider>
  );
}
