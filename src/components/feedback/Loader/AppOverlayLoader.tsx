import React from 'react';

export const AppOverlayLoader: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50 dark:bg-slate-900 backdrop-blur-md">
            <div className="flex flex-col items-center gap-5">
                {}
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-800" />
                    <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-brand-teal-500 animate-spin" />
                </div>
                {}
                <span className="text-sm font-bold tracking-widest uppercase text-slate-500 animate-pulse">
                    Loading
                </span>
            </div>
        </div>
    );
};
