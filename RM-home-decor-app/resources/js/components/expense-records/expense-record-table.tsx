import { Pencil, Trash2 } from 'lucide-react';
import { SortableHeader } from '@/components/sortable-header';
import type { SortDirection } from '@/components/sortable-header';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';
import type { ExpenseRecord } from '@/types';

/** Colunas ordenáveis (mesma whitelist de ExpenseRecordController::SORTABLE). */
export type ExpenseRecordSortKey =
    | 'created_at'
    | 'description'
    | 'product_quantity'
    | 'total_cost'
    | 'cost_per_product';

type Props = {
    records: ExpenseRecord[];
    sortKey: ExpenseRecordSortKey;
    sortDirection: SortDirection;
    onSort: (sortKey: ExpenseRecordSortKey) => void;
    /** Registro com exclusão em andamento; desabilita as outras exclusões. */
    deletingRecordId: number | null;
    onEdit: (record: ExpenseRecord) => void;
    onDelete: (record: ExpenseRecord) => void;
};

export function ExpenseRecordTable({
    records,
    sortKey,
    sortDirection,
    onSort,
    deletingRecordId,
    onEdit,
    onDelete,
}: Props) {
    const headerProps = {
        activeSortKey: sortKey,
        direction: sortDirection,
        onSort,
    };

    return (
        <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
                <thead className="bg-muted">
                    <tr>
                        <SortableHeader
                            label="Data"
                            sortKey="created_at"
                            {...headerProps}
                        />
                        <SortableHeader
                            label="Descrição"
                            sortKey="description"
                            {...headerProps}
                        />
                        <SortableHeader
                            label="Quantidade"
                            sortKey="product_quantity"
                            align="right"
                            {...headerProps}
                        />
                        <SortableHeader
                            label="Custo total"
                            sortKey="total_cost"
                            align="right"
                            {...headerProps}
                        />
                        <SortableHeader
                            label="Valor por produto"
                            sortKey="cost_per_product"
                            align="right"
                            {...headerProps}
                        />
                        <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {records.length === 0 ? (
                        <tr>
                            <td
                                colSpan={6}
                                className="px-4 py-8 text-center text-muted-foreground"
                            >
                                Nenhum registro encontrado.
                            </td>
                        </tr>
                    ) : (
                        records.map((record) => (
                            <tr key={record.id} className="border-t">
                                <td className="px-4 py-3">
                                    {new Date(
                                        record.created_at,
                                    ).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-4 py-3">
                                    {record.description}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {record.product_quantity}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {formatMoney(record.total_cost)}
                                </td>
                                <td className="px-4 py-3 text-right font-medium">
                                    {formatMoney(record.cost_per_product)}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onEdit(record)}
                                        >
                                            <Pencil />
                                            Editar
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            disabled={deletingRecordId !== null}
                                            onClick={() => onDelete(record)}
                                        >
                                            <Trash2 />
                                            {deletingRecordId === record.id
                                                ? 'Excluindo...'
                                                : 'Excluir'}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
