import type { SortDirection } from '@/components/sortable-header';
import type { ExpenseRecord } from '@/types';

export type ExpenseRecordSortKey =
    | 'created_at'
    | 'description'
    | 'product_quantity'
    | 'total_cost'
    | 'cost_per_product';

export function sortExpenseRecords(
    records: ExpenseRecord[],
    sortKey: ExpenseRecordSortKey,
    direction: SortDirection,
): ExpenseRecord[] {
    return [...records].sort((first, second) => {
        let comparison: number;

        if (sortKey === 'description') {
            comparison = first.description.localeCompare(
                second.description,
                'pt-BR',
            );
        } else if (sortKey === 'created_at') {
            comparison =
                new Date(first.created_at).getTime() -
                new Date(second.created_at).getTime();
        } else {
            comparison = Number(first[sortKey]) - Number(second[sortKey]);
        }

        return direction === 'asc' ? comparison : -comparison;
    });
}
