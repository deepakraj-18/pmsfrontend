import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Button } from '@/components/forms/Button';
import { tasksService } from '@/api/services/tasks.service';
import { useToast } from '@/providers/ToastContext';
import {
    ArrowLeft, Upload, FileText, CheckCircle, Download,
    AlertCircle, Star, Info, Hash, Calendar, Clock, Tag, Layers, ClipboardList
} from 'lucide-react';

type FieldTier = 'required' | 'recommended' | 'optional';

interface FieldDef {
    key: string;
    tier: FieldTier;
    note: string;
    icon: React.ReactNode;
    example: string;
}

const TASK_FIELDS: FieldDef[] = [
    { key: 'task_name',             tier: 'required',    note: 'Name / title of the task',                icon: <ClipboardList size={13}/>, example: 'Design Login Screen' },
    { key: 'project_id',            tier: 'recommended', note: 'Numeric project ID',                      icon: <Hash size={13}/>,          example: '12' },
    { key: 'status_id',             tier: 'recommended', note: 'Numeric status ID',                       icon: <Info size={13}/>,          example: '3' },
    { key: 'priority_id',           tier: 'recommended', note: 'Numeric priority ID',                     icon: <Star size={13}/>,          example: '2' },
    { key: 'due_date',              tier: 'recommended', note: 'YYYY-MM-DD',                              icon: <Calendar size={13}/>,      example: '2026-06-30' },
    { key: 'description',           tier: 'optional',    note: 'Detailed description of the task',        icon: <FileText size={13}/>,      example: 'Implement the login UI...' },
    { key: 'task_list_id',          tier: 'optional',    note: 'Numeric task list ID',                    icon: <Layers size={13}/>,        example: '5' },
    { key: 'milestone_id',          tier: 'optional',    note: 'Numeric milestone ID',                    icon: <Hash size={13}/>,          example: '7' },
    { key: 'start_date',            tier: 'optional',    note: 'YYYY-MM-DD',                              icon: <Calendar size={13}/>,      example: '2026-06-01' },
    { key: 'completion_date',       tier: 'optional',    note: 'YYYY-MM-DD',                              icon: <Calendar size={13}/>,      example: '2026-06-28' },
    { key: 'estimated_hours',       tier: 'optional',    note: 'Decimal number',                          icon: <Clock size={13}/>,         example: '8.5' },
    { key: 'billing_type',          tier: 'optional',    note: 'Billable / Non-Billable / Internal',      icon: <Tag size={13}/>,           example: 'Billable' },
    { key: 'completion_percentage', tier: 'optional',    note: '0 to 100',                                icon: <Info size={13}/>,          example: '25' },
    { key: 'tags',                  tier: 'optional',    note: 'Comma-separated values',                  icon: <Tag size={13}/>,           example: 'api,backend' },
];

const TIER_CONFIG = {
    required:    { label: 'Required',    bg: 'bg-red-50 dark:bg-red-900/20',    text: 'text-red-600 dark:text-red-400',    border: 'border-red-200 dark:border-red-800',    dot: 'bg-red-500'    },
    recommended: { label: 'Recommended', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-700', dot: 'bg-amber-500' },
    optional:    { label: 'Optional',    bg: 'bg-slate-50 dark:bg-slate-800',   text: 'text-slate-400 dark:text-slate-500', border: 'border-slate-200 dark:border-slate-700', dot: 'bg-slate-300 dark:bg-slate-600'   },
};

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}

export function TaskImportPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = (f: File) => {
        if (f.name.endsWith('.csv')) setFile(f);
        else showToast('warning', 'Invalid File', 'Please upload a CSV file.');
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    };

    const parseCSV = (text: string) => {
        const lines = text.split(/\r?\n/);
        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
        const tasks: any[] = [];
        lines.slice(1).forEach(line => {
            if (!line.trim()) return;
            const values = parseCSVLine(line);
            const task: any = {};
            headers.forEach((h, i) => {
                const v = values[i] ?? '';
                if (h === 'task_name'             && v) task.task_name              = v;
                if (h === 'description'            && v) task.description             = v;
                if (h === 'project_id'             && v) task.project_id              = parseInt(v) || null;
                if (h === 'task_list_id'           && v) task.task_list_id            = parseInt(v) || null;
                if (h === 'milestone_id'           && v) task.milestone_id            = parseInt(v) || null;
                if (h === 'status_id'              && v) task.status_id               = parseInt(v) || null;
                if (h === 'priority_id'            && v) task.priority_id             = parseInt(v) || null;
                if (h === 'start_date'             && v) task.start_date              = v;
                if (h === 'due_date'               && v) task.due_date                = v;
                if (h === 'completion_date'        && v) task.completion_date         = v;
                if (h === 'estimated_hours'        && v) task.estimated_hours         = parseFloat(v) || 0;
                if (h === 'billing_type'           && v) task.billing_type            = v;
                if (h === 'completion_percentage'  && v) task.completion_percentage   = parseInt(v) || 0;
                if (h === 'tags'                   && v) task.tags                    = v;
            });
            if (task.task_name) tasks.push(task);
        });
        return tasks;
    };

    const handleImport = async () => {
        if (!file) return;
        setImporting(true);
        try {
            const text = await file.text();
            const tasks = parseCSV(text);
            if (tasks.length === 0) {
                showToast('warning', 'Empty File', 'No valid rows found. Make sure "task_name" column exists and is filled.');
                return;
            }
            await tasksService.bulkCreateTasks(tasks);
            showToast('success', 'Import Successful', `${tasks.length} task${tasks.length !== 1 ? 's' : ''} imported.`);
            navigate('/tasks');
        } catch {
            showToast('error', 'Import Failed', 'Failed to parse or upload. Please check your CSV format and try again.');
        } finally {
            setImporting(false);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = TASK_FIELDS.map(f => f.key);
        const sample1 = ['Design Login Screen', '12', '3', '2', '2026-06-30', 'Build the UI for the login page', '5', '', '2026-06-01', '', '8', 'Billable', '0', 'frontend,ui'];
        const sample2 = ['Implement Auth API', '12', '3', '1', '2026-07-10', 'JWT-based auth endpoint', '5', '', '2026-06-15', '', '12', 'Billable', '0', 'api,auth'];
        const csvContent = [headers, sample1, sample2].map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'tasks_import_template.csv';
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        showToast('success', 'Template Downloaded', 'Fill it in and import it back here.');
    };

    const grouped = {
        required:    TASK_FIELDS.filter(f => f.tier === 'required'),
        recommended: TASK_FIELDS.filter(f => f.tier === 'recommended'),
        optional:    TASK_FIELDS.filter(f => f.tier === 'optional'),
    };

    return (
        <PageLayout
            title="Import Tasks"
            actions={
                <Button variant="secondary" size="sm" onClick={() => navigate('/tasks')}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Tasks
                </Button>
            }
        >
            <div className="max-w-4xl mx-auto py-6 space-y-5">

                {/* Top: instructions + download in one row */}
                <div className="flex items-start gap-3 px-4 py-3.5 bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-200 dark:border-sky-800">
                    <AlertCircle className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[12.5px] text-sky-700 dark:text-sky-300 flex-1">
                        Upload a <strong>.csv</strong> file where the first row contains column headers. Fields marked <span className="text-red-500 font-bold">Required</span> must be present. <span className="text-amber-600 dark:text-amber-400 font-semibold">Recommended</span> fields greatly improve data quality.
                    </p>
                    <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="flex-shrink-0 gap-1.5 !text-[12px]">
                        <Download className="w-3.5 h-3.5" /> Template
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Left: Field reference */}
                    <div className="space-y-3">
                        {(['required', 'recommended', 'optional'] as FieldTier[]).map(tier => {
                            const cfg = TIER_CONFIG[tier];
                            const fields = grouped[tier];
                            return (
                                <div key={tier} className={`rounded-2xl border ${cfg.border} overflow-hidden`}>
                                    <div className={`flex items-center gap-2 px-3.5 py-2.5 ${cfg.bg}`}>
                                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                        <span className={`text-[11px] font-black uppercase tracking-wider ${cfg.text}`}>{cfg.label} Fields</span>
                                        <span className={`ml-auto text-[10px] font-bold ${cfg.text} opacity-60`}>{fields.length} field{fields.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                        {fields.map(f => (
                                            <div key={f.key} className="flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <span className={`flex-shrink-0 mt-0.5 ${cfg.text}`}>{f.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <code className={`text-[12px] font-mono font-bold ${cfg.text}`}>{f.key}</code>
                                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{f.note}</p>
                                                </div>
                                                <span className="flex-shrink-0 text-[10px] text-slate-300 dark:text-slate-600 font-mono italic mt-0.5 truncate max-w-[80px]">e.g. {f.example}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right: Upload + actions */}
                    <div className="space-y-4">
                        {/* Drop zone */}
                        <div
                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('task-csv-input')?.click()}
                            className={`relative cursor-pointer rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-16 transition-all duration-200 select-none
                                ${isDragging
                                    ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/10 scale-[1.01]'
                                    : file
                                        ? 'border-teal-400 bg-teal-50/60 dark:bg-teal-900/10'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                }`}
                        >
                            <input id="task-csv-input" type="file" accept=".csv" className="hidden"
                                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

                            {file ? (
                                <div className="flex flex-col items-center gap-3 px-6 text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shadow-sm">
                                        <FileText className="w-7 h-7 text-teal-500" />
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-bold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">{file.name}</p>
                                        <p className="text-[12px] text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB · CSV file ready</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-teal-500">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="text-[12px] font-semibold">File selected</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">Click to change file</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 px-6 text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <Upload className="w-7 h-7 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-semibold text-slate-700 dark:text-slate-200">Drop CSV here</p>
                                        <p className="text-[12px] text-slate-400 mt-0.5">or click to browse</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* How it works */}
                        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
                            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">How it works</p>
                            <div className="space-y-2.5">
                                {[
                                    { n: 1, text: 'Download the template above' },
                                    { n: 2, text: 'Fill in your tasks (one per row)' },
                                    { n: 3, text: 'Upload the filled CSV here' },
                                    { n: 4, text: 'Click Import Tasks to submit' },
                                ].map(s => (
                                    <div key={s.n} className="flex items-center gap-3">
                                        <span className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                                            {s.n}
                                        </span>
                                        <span className="text-[12.5px] text-slate-600 dark:text-slate-400">{s.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2.5">
                            <Button variant="secondary" size="sm" onClick={() => navigate('/tasks')} className="flex-1">Cancel</Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleImport}
                                disabled={!file || importing}
                                loading={importing}
                                className="flex-1"
                            >
                                {importing ? 'Importing…' : `Import Tasks${file ? '' : ''}`}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
