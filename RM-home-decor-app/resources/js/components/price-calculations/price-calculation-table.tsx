import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';
import { outdatedCostsDescription } from './types';
import type { PriceCalculationRow } from './types';

type Props = {
    calculations: PriceCalculationRow[];
    /** Mensagem quando a lista filtrada está vazia. */
    emptyMessage: string;
    /** Cálculo com exclusão em andamento; desabilita as outras exclusões. */
    deletingCalculationId: number | null;
    onEdit: (calculation: PriceCalculationRow) => void;
    onDelete: (calculation: PriceCalculationRow) => void;
};

export function PriceCalculationTable({
    calculations,
    emptyMessage,
    deletingCalculationId,
    onEdit,
    onDelete,
}: Props) {
    return (
        <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
                <thead className="bg-muted">
                    <tr>
                        <th className="px-4 py-3 text-left">Data</th>
                        <th className="px-4 py-3 text-left">Produto</th>
                        <th className="px-4 py-3 text-left">Viagem</th>
                        <th className="px-4 py-3 text-right">
                            Custo do produto
                        </th>
                        <th className="px-4 py-3 text-right">
                            Custo da viagem
                        </th>
                        <th className="px-4 py-3 text-right">Markup</th>
                        <th className="px-4 py-3 text-right">Preço final</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {calculations.length === 0 ? (
                        <tr>
                            <td
                                colSpan={8}
                                className="px-4 py-8 text-center text-muted-foreground"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        calculations.map((calculation) => (
                            <tr key={calculation.id} className="border-t">
                                <td className="px-4 py-3">
                                    {new Date(
                                        calculation.created_at,
                                    ).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span>{calculation.product_name}</span>
                                        {calculation.is_outdated && (
                                            <Badge
                                                variant="outline"
                                                className="border-amber-500/50 text-amber-600 dark:text-amber-400"
                                                title={outdatedCostsDescription(
                                                    calculation,
                                                )}
                                            >
                                                Custo alterado
                                            </Badge>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    {calculation.expense_record_description}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {formatMoney(calculation.product_cost)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {formatMoney(
                                        calculation.trip_cost_per_product,
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {calculation.profit_margin === null ? (
                                        <span
                                            className="text-muted-foreground"
                                            title="Preço definido manualmente"
                                        >
                                            —
                                        </span>
                                    ) : (
                                        <>
                                            {Number(
                                                calculation.profit_margin,
                                            ).toLocaleString('pt-BR')}
                                            %
                                        </>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right font-medium">
                                    {formatMoney(calculation.final_price)}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onEdit(calculation)}
                                        >
                                            <Pencil />
                                            Editar
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            disabled={
                                                deletingCalculationId !== null
                                            }
                                            onClick={() =>
                                                onDelete(calculation)
                                            }
                                        >
                                            <Trash2 />
                                            {deletingCalculationId ===
                                            calculation.id
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
