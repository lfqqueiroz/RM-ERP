import { Pencil, ShoppingCart, Trash2, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';
import { PriceSelector } from './price-selector';
import { effectiveMinimumStock } from './types';
import type { ProductPriceOption, ProductRow } from './types';

type Props = {
    products: ProductRow[];
    priceCalculations: ProductPriceOption[];
    defaultMinimumStock: number;
    /** Produto com venda em andamento (botão "Registrando..."). */
    sellingProductId: number | null;
    /** Produto com troca de preço salvo em andamento. */
    updatingPriceProductId: number | null;
    onSelectPrice: (product: ProductRow, priceCalculationId: string) => void;
    onEdit: (product: ProductRow) => void;
    onDelete: (product: ProductRow) => void;
    onSell: (product: ProductRow) => void;
};

export function ProductTable({
    products,
    priceCalculations,
    defaultMinimumStock,
    sellingProductId,
    updatingPriceProductId,
    onSelectPrice,
    onEdit,
    onDelete,
    onSell,
}: Props) {
    return (
        <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
                <thead className="bg-muted">
                    <tr>
                        <th className="px-4 py-3 text-left">Produto</th>
                        <th className="px-4 py-3 text-left">SKU</th>
                        <th className="px-4 py-3 text-left">Preço salvo</th>
                        <th className="px-4 py-3 text-left">
                            Valor do produto
                        </th>
                        <th className="px-4 py-3 text-left">Estoque</th>
                        <th className="px-4 py-3 text-left">Editar</th>
                        <th className="px-4 py-3 text-left">Deletar</th>
                        <th className="px-4 py-3 text-right">Venda</th>
                    </tr>
                </thead>

                <tbody>
                    {products.length === 0 ? (
                        <tr>
                            <td
                                colSpan={8}
                                className="px-4 py-8 text-center text-muted-foreground"
                            >
                                Nenhum produto encontrado.
                            </td>
                        </tr>
                    ) : (
                        products.map((product) => {
                            const minimumStock = effectiveMinimumStock(
                                product,
                                defaultMinimumStock,
                            );

                            return (
                                <tr key={product.id} className="border-t">
                                    <td className="px-4 py-3">
                                        {product.name}
                                    </td>
                                    <td className="px-4 py-3">{product.sku}</td>
                                    <td className="px-4 py-3">
                                        <PriceSelector
                                            product={product}
                                            options={priceCalculations.filter(
                                                (calculation) =>
                                                    calculation.product_id ===
                                                    product.id,
                                            )}
                                            disabled={
                                                updatingPriceProductId ===
                                                product.id
                                            }
                                            onChange={(priceCalculationId) =>
                                                onSelectPrice(
                                                    product,
                                                    priceCalculationId,
                                                )
                                            }
                                        />
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            {formatMoney(product.sale_price)}
                                            {product.is_price_outdated && (
                                                <TriangleAlert
                                                    role="img"
                                                    aria-label="Custo alterado desde o cálculo deste preço"
                                                    className="size-4 text-amber-500"
                                                >
                                                    <title>
                                                        O custo mudou desde o
                                                        cálculo deste preço.
                                                        Recalcule em Cálculo de
                                                        preço.
                                                    </title>
                                                </TriangleAlert>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span>{product.stock}</span>
                                            {product.stock <= minimumStock && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-amber-500/50 text-amber-600 dark:text-amber-400"
                                                    title={`Estoque mínimo: ${minimumStock}${product.minimum_stock > 0 ? '' : ' (padrão)'}`}
                                                >
                                                    Estoque baixo
                                                </Badge>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onEdit(product)}
                                        >
                                            <Pencil />
                                            Editar
                                        </Button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => onDelete(product)}
                                        >
                                            <Trash2 />
                                            Excluir
                                        </Button>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {product.stock === 0 ? (
                                            <div className="flex flex-col items-end gap-1">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    disabled
                                                >
                                                    <ShoppingCart />
                                                    Unidade vendida
                                                </Button>
                                                <span className="text-xs font-medium text-destructive">
                                                    Estoque vazio
                                                </span>
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                size="sm"
                                                disabled={
                                                    sellingProductId !== null
                                                }
                                                onClick={() => onSell(product)}
                                            >
                                                <ShoppingCart />
                                                {sellingProductId === product.id
                                                    ? 'Registrando...'
                                                    : 'Vender 1 unidade'}
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
