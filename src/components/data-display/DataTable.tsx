import React, { useState, useCallback } from 'react';
import { DataTable as PrimeDataTable } from 'primereact/datatable';
import { Column as PrimeColumn } from 'primereact/column';
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';
import { Search } from 'lucide-react';

export { PrimeColumn as Column };

export interface DataTableColumn<T> {
    key: string;
    header: string;
    sortable?: boolean;
    filterable?: boolean;
    field?: string;
    width?: string;
    render?: (value: any, row: T) => React.ReactNode;
}

export interface LazyParams {
    first: number;
    rows: number;
    page: number;
    sortField?: string;
    sortOrder?: number | null;
}

interface DataTableProps<T> extends Omit<
    React.ComponentProps<typeof PrimeDataTable<T[]>>,
    'value' | 'columns' | 'onRowClick' | 'onPage' | 'onSort'
> {
    columns: DataTableColumn<T>[];
    data: T[];
    children?: React.ReactNode;
    selectable?: boolean;
    onRowClick?: (row: T) => void;
    itemsPerPage?: number;
    hideHeader?: boolean;
    loading?: boolean;
    emptyMessage?: React.ReactNode;
    lazy?: boolean;
    totalRecords?: number;
    lazyParams?: LazyParams;
    onLazyLoad?: (params: LazyParams) => void;
    onPageChange?: (first: number, rows: number) => void;
    rowExpansionTemplate?: (data: T) => React.ReactNode;
    expandedRows?: any;
    onRowToggle?: (e: any) => void;
    dataKey?: string;
    pt?: any;
}

function SkeletonRow({ cols }: { cols: number }) {
    return (
        <div className="flex gap-4 px-5 py-3.5 border-b" style={{ borderColor: 'var(--border-color)' }}>
            {Array.from({ length: cols }).map((_, i) => (
                <div
                    key={i}
                    className="flex-1 h-3 rounded animate-pulse"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        animationDelay: `${i * 70}ms`,
                    }}
                />
            ))}
        </div>
    );
}

function TableSkeleton({ cols }: { cols: number }) {
    return (
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
            <div className="flex gap-4 px-5 py-3 border-b" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                {Array.from({ length: cols }).map((_, i) => (
                    <div key={i} className="flex-1 h-3 rounded animate-pulse" style={{ backgroundColor: 'var(--border-color)', animationDelay: `${i * 60}ms` }} />
                ))}
            </div>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={cols} />)}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
                <Search className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-[14px] font-semibold" style={{ color: 'var(--text-secondary)' }}>No results found</p>
            <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>Try adjusting your filters or search terms.</p>
        </div>
    );
}

export function DataTable<T extends Record<string, any>>({
    columns,
    data,
    selectable = false,
    onRowClick,
    itemsPerPage = 10,
    hideHeader = false,
    loading = false,
    emptyMessage,
    lazy = false,
    totalRecords,
    lazyParams: externalLazyParams,
    onLazyLoad,
    onPageChange,
    rowExpansionTemplate,
    expandedRows,
    onRowToggle,
    dataKey,
    pt: externalPt,
    ...rest
}: DataTableProps<T>) {
    const [internalFirst, setInternalFirst] = useState(0);
    const [internalRows, setInternalRows] = useState(itemsPerPage);

    const first = lazy && externalLazyParams ? externalLazyParams.first : internalFirst;
    const rows = lazy && externalLazyParams ? externalLazyParams.rows : internalRows;

    const handlePageChange = useCallback(
        (e: PaginatorPageChangeEvent) => {
            if (lazy && onLazyLoad) {
                onLazyLoad({
                    first: e.first,
                    rows: e.rows,
                    page: e.page,
                    sortField: externalLazyParams?.sortField,
                    sortOrder: externalLazyParams?.sortOrder,
                });
            } else {
                setInternalFirst(e.first);
                setInternalRows(e.rows);
                onPageChange?.(e.first, e.rows);
            }
        },
        [lazy, onLazyLoad, externalLazyParams, onPageChange],
    );

    const handleSort = useCallback(
        (e: { sortField: string; sortOrder: 1 | -1 | 0 | null | undefined }) => {
            if (lazy && onLazyLoad && externalLazyParams) {
                onLazyLoad({ ...externalLazyParams, sortField: e.sortField, sortOrder: e.sortOrder });
            }
        },
        [lazy, onLazyLoad, externalLazyParams],
    );

    if (loading) return <TableSkeleton cols={columns.length} />;

    const total = totalRecords ?? data.length;
    const showPaginator = total > rows;
    const visibleData = lazy ? data : data.slice(first, first + rows);

    const tablePt = {
        root: {
            className: 'w-full overflow-hidden',
        },
        headerRow: {
            className: hideHeader ? 'hidden' : 'bg-slate-50/50 dark:bg-slate-800/30',
        },
        headerCell: {
            className: 'py-4 px-6 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-100 dark:border-slate-800/50 text-[13px] text-left',
        },
        bodyRow: (options: any) => ({
            className: `transition-all duration-200 group ${onRowClick ? 'cursor-pointer' : ''} ${options.context.selected ? 'bg-slate-50 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`,
            style: { borderBottom: '0.5px solid var(--border-color, rgba(226, 232, 240, 0.5))' }
        }),
        bodyCell: (options: any) => ({
            className: `py-4 px-6 text-slate-600 dark:text-slate-400 text-[13px] ${options.index === options.props.value.length - 1 ? 'border-b-0' : 'border-b border-slate-100/50 dark:border-slate-800/50'
                }`,
        }),
        ...externalPt,
    };

    return (
        <div className="flex flex-col w-full h-full min-h-0 relative">
            <div className="flex-1 min-h-0 overflow-auto relative">
                <PrimeDataTable
                    value={visibleData}
                    loading={false}
                    onRowClick={(e) => onRowClick?.(e.data as T)}
                    onSort={lazy ? (e: any) => handleSort(e) : undefined}
                    sortField={lazy ? externalLazyParams?.sortField : undefined}
                    sortOrder={(lazy ? (externalLazyParams?.sortOrder ?? null) : undefined) as any}
                    expandedRows={expandedRows}
                    onRowToggle={onRowToggle}
                    rowExpansionTemplate={rowExpansionTemplate}
                    dataKey={dataKey}
                    pt={tablePt}
                    emptyMessage={emptyMessage ?? <EmptyState />}
                    {...(rest as any)}
                >
                    {selectable && <PrimeColumn selectionMode="multiple" headerStyle={{ width: '3rem' }} />}
                    {columns.map((col) => (
                        <PrimeColumn
                            key={col.key || col.field}
                            field={col.key || col.field}
                            header={col.header}
                            sortable={col.sortable}
                            style={col.width ? { width: col.width } : undefined}
                            body={(rowData) =>
                                col.render
                                    ? col.render(rowData[col.key || col.field || ''], rowData)
                                    : rowData[col.key || col.field || '']
                            }
                        />
                    ))}
                    {rest.children}
                </PrimeDataTable>
            </div>

            {showPaginator && (
                <div
                    className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 w-full z-10"
                >
                    <p className="text-[12px] text-slate-500 dark:text-slate-400">
                        Showing{' '}
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {first + 1}–{Math.min(first + rows, total)}
                        </span>{' '}
                        of <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{total}</span>
                    </p>
                    <Paginator
                        first={first}
                        rows={rows}
                        totalRecords={total}
                        rowsPerPageOptions={[10, 20, 50, 100]}
                        onPageChange={handlePageChange}
                        template="RowsPerPageDropdown PrevPageLink PageLinks NextPageLink"
                        className="!p-0 !bg-transparent border-0"
                    />
                </div>
            )}
        </div>
    );
}
