import { useQuery } from '@tanstack/react-query';
import { rolesService, Role as ApiRole } from '@/features/roles/api/roles.api';
import { LazyLoadEvent } from '@/components/data-display/MasterTable';

export interface PaginatedResponse<T> {
    data: T[];
    totalRecords: number;
    page: number;
}

export function useRolesQuery(lazyParams: LazyLoadEvent) {
    return useQuery<PaginatedResponse<ApiRole>, Error>({
        queryKey: ['roles', lazyParams],
        queryFn: async () => {
            
            const data = await rolesService.getRoles();
            
            let processedData = [...data];
            
            if (lazyParams.globalFilter) {
               processedData = processedData.filter(r => r.name.toLowerCase().includes((lazyParams.globalFilter as string).toLowerCase()));
            }
            
            if (lazyParams.sortField) {
               processedData.sort((a, b) => {
                   const valA = (a as any)[lazyParams.sortField as string];
                   const valB = (b as any)[lazyParams.sortField as string];
                   const result = valA < valB ? -1 : valA > valB ? 1 : 0;
                   return lazyParams.sortOrder === -1 ? -result : result;
               });
            }

            const totalRecords = processedData.length;
            const pagedData = processedData.slice(lazyParams.first, lazyParams.first + lazyParams.rows);

            return {
                data: pagedData,
                totalRecords: totalRecords,
                page: lazyParams.page
            };
        },
        placeholderData: (previousData) => previousData, 
    });
}
