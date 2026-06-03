import React from 'react';

export function DetailViewSkeleton() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-pulse">
            {}
            <div className="h-[120px] rounded-[24px] bg-slate-200 dark:bg-slate-800/50 w-full" />

            {}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[72px] rounded-2xl bg-slate-200 dark:bg-slate-800/50 w-full" />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {}
                <div className="lg:col-span-8">
                    <div className="h-[400px] rounded-2xl bg-slate-200 dark:bg-slate-800/50 w-full" />
                </div>

                {}
                <div className="lg:col-span-4 space-y-6">
                    <div className="h-[120px] rounded-2xl bg-slate-200 dark:bg-slate-800/50 w-full" />
                    <div className="h-[200px] rounded-2xl bg-slate-200 dark:bg-slate-800/50 w-full" />
                    <div className="h-[250px] rounded-2xl bg-slate-200 dark:bg-slate-800/50 w-full" />
                </div>
            </div>
        </div>
    );
}
