import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Search, Filter,
    MoreHorizontal, X, Maximize2, Minimize2,
    Calendar, Clock, User, Tag, Hash, Shield, FolderKanban
} from 'lucide-react';
import { Button } from '@/components/forms/Button';
import { Card } from '@/components/layout/Card';
import { Badge } from '@/components/data-display/Badge';
import { PageLayout } from '@/layouts/PageWrapper/PageLayout';
import { SectionLoadingIndicator } from '@/components/feedback/Loader/SectionLoadingIndicator';

interface SidebarItem {
    id: number;
    title: string;
    subtitle?: string;
    status?: any;
    priority?: any;
    identifier: string;
}

interface ZohoEntityDetailLayoutProps {
    title: string;
    subtitle: React.ReactNode;
    identifier: string;
    entityType: 'Task' | 'Issue';
    status: any;
    priority?: any;
    sidebarItems: SidebarItem[];
    sidebarLoading?: boolean;
    onSidebarItemClick: (id: number) => void;
    actions?: React.ReactNode;
    children: React.ReactNode;
    tabs: { label: string; content: React.ReactNode; count?: number }[];
    activeTab: string;
    onTabChange: (label: string) => void;
    infoSections: { title: string; content: React.ReactNode; defaultOpen?: boolean }[];
    exitPath?: string;
    headerStats?: { label: string; value: React.ReactNode; icon?: React.ReactNode; color?: string }[];
    metadata?: React.ReactNode[];
}

export function ZohoEntityDetailLayout({
    title, subtitle, identifier, entityType, status, priority,
    sidebarItems, sidebarLoading, onSidebarItemClick,
    actions, children, tabs, activeTab, onTabChange, infoSections,
    exitPath, headerStats, metadata
}: ZohoEntityDetailLayoutProps) {
    const navigate = useNavigate();
    const [sidebarSearch, setSidebarSearch] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const filteredSidebarItems = sidebarItems.filter(item =>
        item.title.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
        item.identifier.toLowerCase().includes(sidebarSearch.toLowerCase())
    );

    return (
        <PageLayout showBackButton={false} isFullHeight noPadding>
            <div className="flex h-full overflow-hidden bg-[#f8fafc] dark:bg-slate-950">
                <motion.div
                    initial={false}
                    animate={{ width: isSidebarOpen ? 320 : 0, opacity: isSidebarOpen ? 1 : 0 }}
                    className="border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden relative"
                >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">All {entityType}s</span>
                        </div>
                        <Button variant="ghost" size="xs" onClick={() => setIsSidebarOpen(false)} tooltip="Collapse sidebar">
                            <ChevronLeft size={14} />
                        </Button>
                    </div>

                    <div className="px-4 py-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                            <input
                                type="text"
                                placeholder={`Search ${entityType.toLowerCase()}s...`}
                                value={sidebarSearch}
                                onChange={(e) => setSidebarSearch(e.target.value)}
                                className="w-full h-9 pl-9 pr-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-1 pb-4">
                        {sidebarLoading ? (
                            <div className="py-20 text-center"><i className="pi pi-spin pi-spinner text-teal-500 text-xl" /></div>
                        ) : filteredSidebarItems.length === 0 ? (
                            <div className="py-20 text-center text-slate-400 text-xs italic px-4">No {entityType.toLowerCase()}s found matching "{sidebarSearch}"</div>
                        ) : filteredSidebarItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => onSidebarItemClick(item.id)}
                                className={`w-full text-left p-4 rounded-xl transition-all group ${item.identifier === identifier
                                    ? 'bg-white dark:bg-slate-800 border border-teal-500/30 shadow-md ring-1 ring-teal-500/10'
                                    : 'hover:bg-white/80 dark:hover:bg-slate-800/50 border border-transparent hover:shadow-sm'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider ${item.identifier === identifier ? 'bg-teal-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                        }`}>
                                        {item.identifier}
                                    </span>
                                    {item.status && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800">
                                            {item.status.label || item.status.name || item.status}
                                        </span>
                                    )}
                                </div>
                                <p className={`text-[13px] font-bold leading-snug line-clamp-2 ${item.identifier === identifier ? 'text-teal-700 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {item.title}
                                </p>
                                {item.subtitle && (
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-1.5 flex items-center gap-1">
                                        <FolderKanban size={10} className="shrink-0" />
                                        <span className="truncate">{item.subtitle}</span>
                                    </p>
                                )}
                            </button>
                        ))}
                    </div>
                </motion.div>

                <div className="flex-1 flex flex-col overflow-hidden relative">

                    {!isSidebarOpen && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-r-xl p-2.5 text-teal-500 hover:bg-teal-50 transition-colors"
                                title="Expand sidebar"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}

                    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 shrink-0">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                    <span className="text-xs font-black text-slate-400 tracking-wider uppercase">{identifier}</span>
                                    <div className="h-1 w-1 rounded-full bg-slate-300" />
                                    <div className="text-xs font-bold text-teal-600 truncate max-w-[250px]">{subtitle}</div>
                                    <div className="flex items-center gap-2 ml-2">
                                        {status && <Badge label={status.name || status.label || status} variant="primary" size="sm" />}
                                        {priority && <Badge label={priority.name || priority.label || priority} variant="neutral" size="sm" />}
                                    </div>
                                </div>
                                <h1 className="text-xl font-black text-slate-800 dark:text-white truncate tracking-tight">{title}</h1>
                                {metadata && metadata.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                                        {metadata.map((m, i) => (
                                            <div key={i} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                                {m}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {actions}
                                <Button variant="ghost" size="sm" onClick={() => navigate(exitPath || (entityType === 'Task' ? '/tasks' : '/issues'))} tooltip="Go Back">
                                    <X size={18} />
                                </Button>
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#f8fafc] dark:bg-slate-950/30">
                        <div className="max-w-6xl mx-auto space-y-6">
                            {headerStats && headerStats.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-2">
                                    {headerStats.map((stat, idx) => (
                                        <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                                            {stat.icon && (
                                                <div className="p-2.5 rounded-xl shrink-0" style={{ background: stat.color ? `${stat.color}15` : '#6366f115', color: stat.color || '#6366f1' }}>
                                                    {stat.icon}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                                <p className="text-sm font-black truncate text-slate-800 dark:text-slate-100">{stat.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="space-y-6">
                                {infoSections.map((section, idx) => (
                                    <CollapsibleSection key={idx} title={section.title} defaultOpen={section.defaultOpen}>
                                        {section.content}
                                    </CollapsibleSection>
                                ))}
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                                <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 overflow-x-auto no-scrollbar">
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.label}
                                            onClick={() => onTabChange(tab.label)}
                                            className={`px-5 py-4 text-[13px] font-bold whitespace-nowrap border-b-2 transition-all relative ${activeTab === tab.label
                                                ? 'border-teal-500 text-teal-600'
                                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                                }`}
                                        >
                                            {tab.label}
                                            {tab.count !== undefined && (
                                                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.label ? 'bg-teal-500/10 text-teal-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                                    }`}>
                                                    {tab.count}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <div className="p-6 flex-1">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeTab}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                            className="h-full"
                                        >
                                            {tabs.find(t => t.label === activeTab)?.content}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}

function CollapsibleSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-6 py-4 flex items-center justify-between transition-all ${isOpen ? 'bg-slate-50/50 dark:bg-slate-800/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
            >
                <div className="flex items-center gap-3">
                    <ChevronRight size={16} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">{title}</h3>
                </div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <div className="px-6 pb-6 pt-2 border-t border-slate-50 dark:border-slate-800/50">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
