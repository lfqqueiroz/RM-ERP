import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc';

type Props<TKey extends string> = {
    label: string;
    sortKey: TKey;
    activeSortKey: TKey;
    direction: SortDirection;
    onSort: (sortKey: TKey) => void;
    align?: 'left' | 'right';
};

/** Cabeçalho de coluna que ordena a tabela ao ser clicado. */
export function SortableHeader<TKey extends string>({
    label,
    sortKey,
    activeSortKey,
    direction,
    onSort,
    align = 'left',
}: Props<TKey>) {
    const isActive = sortKey === activeSortKey;

    return (
        <th
            aria-sort={
                isActive
                    ? direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                    : 'none'
            }
            className={cn(
                'px-4 py-3',
                align === 'right' ? 'text-right' : 'text-left',
            )}
        >
            <button
                type="button"
                className={cn(
                    'inline-flex items-center gap-1 font-medium hover:text-foreground',
                    align === 'right' && 'ml-auto',
                )}
                onClick={() => onSort(sortKey)}
            >
                {label}
                {isActive && direction === 'asc' ? (
                    <ArrowUp aria-hidden="true" className="size-3" />
                ) : isActive ? (
                    <ArrowDown aria-hidden="true" className="size-3" />
                ) : null}
            </button>
        </th>
    );
}
