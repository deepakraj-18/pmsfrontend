import React from 'react';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
    return (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden animate-pulse">
            {}
            <div className="flex gap-4 px-4 py-3 bg-[#F9FAFB] border-b">
                {Array.from({ length: columns }).map((_, i) => (
                    <div
                        key={`h-${i}`}
                        className="h-3 bg-[#E5E7EB] rounded-full"
                        style={{ width: `${i === 0 ? 60 : 80 + Math.random() * 60}px` }}
                    />
                ))}
            </div>
            {}
            {Array.from({ length: rows }).map((_, r) => (
                <div key={`r-${r}`} className="flex gap-4 px-4 py-4 border-b last:border-0">
                    {Array.from({ length: columns }).map((_, c) => (
                        <div
                            key={`c-${r}-${c}`}
                            className="h-3 bg-[#F3F4F6] rounded-full"
                            style={{ width: `${50 + Math.random() * 100}px` }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
