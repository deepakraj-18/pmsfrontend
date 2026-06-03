import { DataTable, Column, LazyParams as DataTableLazyParams } from '@/components/data-display/DataTable';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { Card } from '@/components/layout/Card';

export interface LazyLoadEvent extends DataTableLazyParams {
  sortField?: string;
  sortOrder?: 1 | 0 | -1 | undefined | null;
  globalFilter?: string | null;
  filters?: Record<string, any>;
}

export interface ColumnSchema {
  field: string;
  header: string;
  body?: (rowData: any) => React.ReactNode;
  sortable?: boolean;
}

export interface MasterTableProps {
  title: string;
  data: any[];
  totalRecords: number;
  columns: ColumnSchema[];
  lazyParams: LazyLoadEvent;
  onLazyLoad: (event: LazyLoadEvent) => void;
  loading?: boolean;
  onCreate?: () => void;
  onExport?: () => void;
  onRowClick?: (rowData: any) => void;
  actions?: (rowData: any) => React.ReactNode;
  hideSearch?: boolean;
}

export const MasterTable: React.FC<MasterTableProps> = ({
  title,
  data,
  totalRecords,
  columns,
  lazyParams,
  onLazyLoad,
  loading = false,
  onCreate,
  onExport,
  onRowClick,
  actions,
  hideSearch = false
}) => {

  const renderHeader = () => {
    return (
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 p-4 border-b border-theme-border rounded-t-[0.75rem]">
        <h2 className="text-xl font-semibold text-theme-primary mb-4 md:mb-0">{title}</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {!hideSearch && (
            <span className="p-input-icon-left w-full sm:w-auto">
              <i className="pi pi-search" />
              <InputText
                value={lazyParams.globalFilter || ''}
                onChange={(e) => onLazyLoad({ ...lazyParams, globalFilter: e.target.value, first: 0, page: 0 })}
                placeholder="Global Search..."
                className="w-full sm:w-64 rounded-[0.75rem] form-control-theme"
              />
            </span>
          )}
          {onExport && (
            <Button
              label="Export"
              icon="pi pi-download"
              outlined
              onClick={onExport}
              className="rounded-[0.75rem] btn-outline-theme border-brand-teal-600 text-brand-teal-600 hover:bg-brand-teal-50 dark:hover:bg-brand-teal-900/20"
            />
          )}
          {onCreate && (
            <Button
              label="Create New"
              icon="pi pi-plus"
              onClick={onCreate}
              className="btn-gradient"
            />
          )}
        </div>
      </div>
    );
  };

  const statusBodyTemplate = (rowData: any) => {
    const statusStr = typeof rowData.status === 'string'
      ? rowData.status
      : rowData.status?.name || '';

    const status = statusStr.toLowerCase();
    let severity: 'success' | 'warning' | 'danger' | 'info' | null = null;

    switch (status) {
      case 'active':
      case 'completed':
      case 'approved':
        severity = 'success';
        break;
      case 'pending':
      case 'in progress':
      case 'review':
        severity = 'warning';
        break;
      case 'closed':
      case 'rejected':
      case 'inactive':
        severity = 'danger';
        break;
      default:
        severity = 'info';
    }

    return <Tag value={statusStr} severity={severity} className="rounded-[0.75rem] px-3 py-1" />;
  };

  const skeletonBodyTemplate = () => {
    return <Skeleton className="mb-2 rounded-[0.75rem]" height="2rem" />;
  };

  return (
    <Card className="p-0 overflow-hidden">
      <DataTable
        data={loading ? Array.from({ length: lazyParams.rows || 5 }).map((_, i) => ({ id: `skeleton-${i}` })) : data}
        lazy
        dataKey="id"
        totalRecords={totalRecords}
        lazyParams={lazyParams}
        onLazyLoad={onLazyLoad}
        itemsPerPage={lazyParams.rows}
        header={renderHeader()}
        emptyMessage="No records found."
        className="w-full text-sm text-theme-primary"
        onRowClick={onRowClick}
        columns={columns.map(col => ({
          key: col.field,
          field: col.field,
          header: col.header,
          sortable: col.sortable !== false,
          render: (val, row) => loading ? skeletonBodyTemplate() : (col.field.toLowerCase() === 'status' && !col.body ? statusBodyTemplate(row) : (col.body ? col.body(row) : val))
        }))}
      >
        {actions && !loading && (
          <Column body={actions} className="p-4 table-body-cell w-24" />
        )}
      </DataTable>
    </Card>
  );
};
