import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { Button } from '@/components/forms/Button';
import { useToast } from '@/providers/ToastContext';
import { useIssueActions } from '../hooks/useIssueActions';
import { handleServerError } from '@/utils/errorHelpers';
import {
    ArrowLeft, Upload, FileText, CheckCircle, Download,
    AlertCircle, Star, Hash, Calendar, Clock, Tag, User, Layers, Info, Flag
} from 'lucide-react';

type FieldTier = 'required' | 'recommended' | 'optional';

interface FieldDef {
    key: string;
    tier: FieldTier;
    note: string;
    icon: React.ReactNode;
    example: string;
}

const ISSUE_FIELDS: FieldDef[] = [
    { key: 'bug_name', tier: 'required', note: 'Title / name of the defect', icon: <FileText size={13} />, example: 'Login button not working' },
    { key: 'project_id', tier: 'recommended', note: 'Numeric project ID', icon: <Hash size={13} />, example: '12' },
    { key: 'status_id', tier: 'recommended', note: 'Numeric status ID', icon: <Info size={13} />, example: '1' },
    { key: 'severity_id', tier: 'recommended', note: 'Numeric severity ID', icon: <Star size={13} />, example: '2' },
    { key: 'priority_id', tier: 'recommended', note: 'Numeric priority ID', icon: <Star size={13} />, example: '1' },
    { key: 'assignee_id', tier: 'recommended', note: 'Numeric user ID of assignee', icon: <User size={13} />, example: '5' },
    { key: 'due_date', tier: 'recommended', note: 'YYYY-MM-DD', icon: <Calendar size={13} />, example: '2026-06-30' },
    { key: 'description', tier: 'optional', note: 'Detailed description', icon: <FileText size={13} />, example: 'Steps to reproduce...' },
    { key: 'reporter_id', tier: 'optional', note: 'Numeric user ID of reporter', icon: <User size={13} />, example: '3' },
    { key: 'classification_id', tier: 'optional', note: 'Numeric classification ID', icon: <Layers size={13} />, example: '4' },
    { key: 'milestone_id', tier: 'optional', note: 'Numeric milestone ID', icon: <Hash size={13} />, example: '7' },
    { key: 'start_date', tier: 'optional', note: 'YYYY-MM-DD', icon: <Calendar size={13} />, example: '2026-05-15' },
    { key: 'estimated_hours', tier: 'optional', note: 'Decimal number', icon: <Clock size={13} />, example: '4.5' },
    { key: 'module', tier: 'optional', note: 'Module or component name', icon: <Layers size={13} />, example: 'Authentication' },
    { key: 'tags', tier: 'optional', note: 'Comma-separated values', icon: <Tag size={13} />, example: 'auth,critical' },
    { key: 'flag', tier: 'optional', note: 'Custom flag label', icon: <Flag size={13} />, example: 'P1' },
    { key: 'reproducible_flag', tier: 'optional', note: 'true or false', icon: <Info size={13} />, example: 'true' },
];

const TIER_CONFIG = {
    required: { label: 'Required', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500' },
    recommended: { label: 'Recommended', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-700', dot: 'bg-amber-500' },
    optional: { label: 'Optional', bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-400 dark:text-slate-500', border: 'border-slate-200 dark:border-slate-700', dot: 'bg-slate-300 dark:bg-slate-600' },
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

export function IssueImportPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const { bulkCreateIssues } = useIssueActions();

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
        const safeDate = (val: string) => {
            if (!val) return undefined;

            const parts = val.split(/[-/]/);
            if (parts.length === 3) {
                if (parts[2].length === 4) {
                    const [p1, p2, year] = parts;
                    const d1 = parseInt(p1);
                    const d2 = parseInt(p2);
                    const month = d2 > 12 ? p1 : p2;
                    const day = d2 > 12 ? p2 : p1;
                    const parsed = new Date(`${year}/${month}/${day}`);
                    if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
                }
            }
            const d = new Date(val);
            if (isNaN(d.getTime())) return undefined;
            return d.toISOString().split('T')[0];
        };
        const lines = text.split(/\r?\n/);
        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
        const issues: any[] = [];
        lines.slice(1).forEach(line => {
            if (!line.trim()) return;
            const values = parseCSVLine(line);
            const issue: any = {};
            headers.forEach((h, i) => {
                const v = values[i] ?? '';
                if (h === 'bug_name' && v) issue.bug_name = v;
                if (h === 'description' && v) issue.description = v;
                if (h === 'project_id' && v) issue.project_id = parseInt(v) || null;
                if (h === 'assignee_id' && v) issue.assignee_id = parseInt(v) || null;
                if (h === 'reporter_id' && v) issue.reporter_id = parseInt(v) || null;
                if (h === 'status_id' && v) issue.status_id = parseInt(v) || null;
                if (h === 'priority_id' && v) issue.priority_id = parseInt(v) || null;
                if (h === 'severity_id' && v) issue.severity_id = parseInt(v) || null;
                if (h === 'classification_id' && v) issue.classification_id = parseInt(v) || null;
                if (h === 'milestone_id' && v) issue.milestone_id = parseInt(v) || null;
                if (h === 'start_date' && v) { const d = safeDate(v); if (d) issue.start_date = d; }
                if (h === 'due_date' && v) { const d = safeDate(v); if (d) issue.due_date = d; }
                if (h === 'estimated_hours' && v) issue.estimated_hours = parseFloat(v) || 0;
                if (h === 'module' && v) issue.module = v;
                if (h === 'tags' && v) issue.tags = v;
                if (h === 'flag' && v) issue.flag = v;
                if (h === 'reproducible_flag' && v) issue.reproducible_flag = v.toLowerCase() !== 'false';
            });
            if (issue.bug_name) issues.push(issue);
        });
        return issues;
    };

    const handleImport = async () => {
        if (!file) return;
        setImporting(true);
        try {
            const text = await file.text();
            const issues = parseCSV(text);
            if (issues.length === 0) {
                showToast('warning', 'Empty File', 'No valid rows found. Make sure the "bug_name" column exists and is filled.');
                return;
            }
            await bulkCreateIssues.mutateAsync(issues);
            showToast('success', 'Import Successful', `${issues.length} defect${issues.length !== 1 ? 's' : ''} imported.`);
            navigate('/issues');
        } catch (err: any) {
            handleServerError(err, (null as any), showToast, 'Import Failed');
        } finally {
            setImporting(false);
        }
    };

    const handleDownloadTemplate = () => {
        const headers = ISSUE_FIELDS.map(f => f.key);
        const sample1 = ['Login button not responding', '12', '1', '2', '1', '5', '2026-06-20', 'Clicking login does nothing on Safari', '3', '4', '', '2026-05-01', '4', 'Authentication', 'auth,safari', 'P1', 'true'];
        const sample2 = ['Dashboard graph missing data', '12', '1', '1', '2', '5', '2026-06-25', 'Charts show empty when no filter applied', '3', '', '', '2026-05-05', '2', 'Dashboard', 'chart,ui', '', 'false'];
        const csvContent = [headers, sample1, sample2].map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'defects_import_template.csv';
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        showToast('success', 'Template Downloaded', 'Fill it in and import it back here.');
    };

    const grouped = {
        required: ISSUE_FIELDS.filter(f => f.tier === 'required'),
        recommended: ISSUE_FIELDS.filter(f => f.tier === 'recommended'),
        optional: ISSUE_FIELDS.filter(f => f.tier === 'optional'),
    };

    return (
        <PageLayout
            title="Import Defects"
            actions={
                <Button variant="secondary" size="sm" onClick={() => navigate('/issues')}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Defects
                </Button>
            }
        >
            <div className="max-w-4xl mx-auto py-6 space-y-5">

                {/* Top info bar */}
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
                                                <span className="flex-shrink-0 text-[10px] text-slate-300 dark:text-slate-600 font-mono italic mt-0.5 truncate max-w-[90px]">e.g. {f.example}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="space-y-4">
                        <div
                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('issue-csv-input')?.click()}
                            className={`relative cursor-pointer rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-16 transition-all duration-200 select-none
                                ${isDragging
                                    ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/10 scale-[1.01]'
                                    : file
                                        ? 'border-teal-400 bg-teal-50/60 dark:bg-teal-900/10'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                }`}
                        >
                            <input id="issue-csv-input" type="file" accept=".csv" className="hidden"
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

                        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
                            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">How it works</p>
                            <div className="space-y-2.5">
                                {[
                                    { n: 1, text: 'Download the template above' },
                                    { n: 2, text: 'Fill in your defects (one per row)' },
                                    { n: 3, text: 'Upload the filled CSV here' },
                                    { n: 4, text: 'Click Import Defects to submit' },
                                ].map(s => (
                                    <div key={s.n} className="flex items-center gap-3">
                                        <span className="w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                                            {s.n}
                                        </span>
                                        <span className="text-[12.5px] text-slate-600 dark:text-slate-400">{s.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2.5">
                            <Button variant="secondary" size="sm" onClick={() => navigate('/issues')} className="flex-1">Cancel</Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleImport}
                                disabled={!file || importing}
                                loading={importing}
                                className="flex-1"
                            >
                                {importing ? 'Importing…' : 'Import Defects'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
