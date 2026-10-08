import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';
import type { Sale } from '@/types';

type Props = {
    sales: Sale[];
    /** Mensagem quando a lista está vazia. */
    emptyMessage: string;
    onEdit: (sale: Sale) => void;
};

export function SaleTable({ sales, emptyMessage, onEdit }: Props) {
    return (
        <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
                <thead className="bg-muted">
                    <tr>
                        <th className="px-4 py-3 text-left">Data</th>
                        <th className="px-4 py-3 text-left">Cliente</th>
                        <th className="px-4 py-3 text-left">Telefone</th>
                        <th className="px-4 py-3 text-left">Itens</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.length === 0 ? (
                        <tr>
                            <td
                                colSpan={6}
                                className="px-4 py-8 text-center text-muted-foreground"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        sales.map((sale) => (
                            <tr key={sale.id} className="border-t">
                                <td className="px-4 py-3 align-top">
                                    {new Date(sale.created_at).toLocaleString(
                                        'pt-BR',
                                    )}
                                </td>
                                <td className="px-4 py-3 align-top">
                                    {sale.customer_name}
                                </td>
                                <td className="px-4 py-3 align-top">
                                    {sale.customer_phone}
                                </td>
                                <td className="px-4 py-3">
                                    <ul className="grid gap-1">
                                        {sale.items.map((item) => (
                                            <li key={item.id}>
                                                {item.quantity}x{' '}
                                                {item.product_name}{' '}
                                                <span className="text-muted-foreground">
                                                    ({item.product_sku})
                                                </span>{' '}
                                                — {formatMoney(item.unit_price)}{' '}
                                                <span className="text-muted-foreground">
                                                    /un.
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                                <td className="px-4 py-3 text-right font-medium">
                                    {formatMoney(sale.total_amount)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onEdit(sale)}
                                    >
                                        <Pencil />
                                        Editar
                                    </Button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
