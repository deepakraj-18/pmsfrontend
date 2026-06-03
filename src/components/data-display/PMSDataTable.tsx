
import React, { useRef } from 'react';
import { DataTable as PrimeDataTable, DataTableRowEditCompleteEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode } from 'primereact/api';
import { InputText } from 'primereact/inputtext';
import { useEffect } from 'react';

export interface PMSColumn<T> {
    field: keyof T & string;
    header: string;
    sortable?: boolean;
    filterable?: boolean;
    filterMatchMode?: FilterMatchMode;
    editable?: boolean;
    width?: string;
    body?: (row: T) => React.ReactNode;
    editor?: (options: any) => React.ReactNode;
}

interface PMSDataTableProps<T extends object> {
    columns: PMSColumn<T>[];
    data: T[];
    dataKey?: string;
    loading?: boolean;
    editMode?: 'row' | 'cell';
    onRowEdit?: (updated: T) => void;
    filterDisplay?: 'row' | 'menu';
    onRowClick?: (row: T) => void;
    itemsPerPage?: number;
    emptyMessage?: string;
    className?: string;
    scrollHeight?: string;
    forceVirtual?: boolean;
}

const VIRTUAL_THRESHOLD = 100;
const VIRTUAL_ITEM_SIZE = 46;

function defaultTextEditor(options: any) {
    return (
        <InputText
            type="text"
            value={options.value}
            onChange={(e) => options.editorCallback(e.target.value)}
            className="w-full"
            style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                borderRadius: '6px',
                padding: '4px 8px',
            }}
        />
    );
}

export function PMSDataTable<T extends object>({
    columns,
    data,
    dataKey = 'id',
    loading = false,
    editMode,
    onRowEdit,
    filterDisplay = 'menu',
    onRowClick,
    itemsPerPage = 50,
    emptyMessage = 'No records found.',
    className = '',
    scrollHeight = '100%',
    forceVirtual = false,
}: PMSDataTableProps<T>) {
    const dt = useRef<PrimeDataTable<T[]>>(null);
    const useVirtual = forceVirtual || data.length > VIRTUAL_THRESHOLD;

    function handleRowEditComplete(e: DataTableRowEditCompleteEvent) {
        if (onRowEdit) onRowEdit(e.newData as T);
    }

    const tableStyle: React.CSSProperties = {
        '--p-datatable-header-background': 'var(--bg-secondary)',
        '--p-datatable-header-color': 'var(--text-secondary)',
        '--p-datatable-body-background': 'var(--bg-card)',
        '--p-datatable-body-color': 'var(--text-primary)',
        '--p-datatable-row-hover-background': 'var(--bg-hover)',
        '--p-datatable-border-color': 'var(--border-color)',
    } as React.CSSProperties;

    return (
        <PrimeDataTable<T[]>
            ref={dt}
            value={data}
            dataKey={dataKey}
            loading={loading}
            editMode={editMode}
            onRowEditComplete={handleRowEditComplete}
            onRowClick={onRowClick ? (e) => onRowClick(e.data as T) : undefined}
            rowClassName={(data) => onRowClick ? 'cursor-pointer' : ''}
            paginator={!useVirtual && data.length > itemsPerPage}
            rows={itemsPerPage}
            rowsPerPageOptions={[25, 50, 100]}
            scrollable
            scrollHeight={scrollHeight}
            virtualScrollerOptions={
                useVirtual ? { itemSize: VIRTUAL_ITEM_SIZE, lazy: false } : undefined
            }
            emptyMessage={emptyMessage}
            className={`pms-datatable ${className}`}
            style={tableStyle}
            rowHover
            size="small"
            showGridlines
            stripedRows
            resizableColumns
            columnResizeMode="expand"
            pt={{
                header:       { className: 'pms-dt-header' },
                headerRow:    { className: 'pms-dt-header-row' },
                bodyRow:      { className: 'pms-dt-row' },
                column:       { bodyCell: { className: 'pms-dt-cell' }, headerCell: { className: 'pms-dt-head-cell' } },
            }}
        >
            {columns.map((col) => (
                <Column
                    key={col.field}
                    field={col.field}
                    header={col.header}
                    sortable={col.sortable}
                    body={col.body ?? undefined}
                    editor={col.editable ? (col.editor ?? defaultTextEditor) : undefined}
                    style={col.width ? { width: col.width } : undefined}
                />
            ))}

            {editMode === 'row' && (
                <Column
                    rowEditor
                    header="Edit"
                    headerStyle={{ width: '80px', minWidth: '80px' }}
                    bodyStyle={{ textAlign: 'center' }}
                />
            )}
        </PrimeDataTable>
    );
}
