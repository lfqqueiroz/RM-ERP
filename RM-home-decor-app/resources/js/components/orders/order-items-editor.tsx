import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { itemErrors } from '@/lib/form-errors';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { PriceCalculation, Product, SaleItem } from '@/types';

/** Item de pedido como editado no formulário (valores de <select>/<input>). */
export type OrderItem = {
    product_id: string;
    quantity: string;
    price_calculation_id: string;
    /**
     * Item já gravado (edição de pedido). Só para a tela: não é enviado ao
     * servidor — o formulário envia apenas o `id`.
     */
    original?: Pick<
        SaleItem,
        'id' | 'product_id' | 'product_name' | 'product_sku' | 'unit_price'
    >;
};

type EditableField = Exclude<keyof OrderItem, 'original'>;

/**
 * Item gravado que continua com o mesmo produto e sem preço escolhido: o
 * servidor mantém o preço unitário gravado (só a quantidade muda).
 */
export function keepsStoredPrice(item: OrderItem): boolean {
    return (
        item.original !== undefined &&
        item.price_calculation_id === '' &&
        item.product_id === String(item.original.product_id ?? '')
    );
}

export type OrderItemProduct = Pick<Product, 'id' | 'name' | 'sku'> & {
    /** Quando informado, aparece na lista de produtos ("3 em estoque"). */
    stock?: number;
};

export type OrderItemPrice = Pick<
    PriceCalculation,
    'id' | 'product_id' | 'final_price'
>;

export function emptyOrderItem(): OrderItem {
    return { product_id: '', quantity: '1', price_calculation_id: '' };
}

type Props = {
    items: OrderItem[];
    onChange: (items: OrderItem[]) => void;
    products: OrderItemProduct[];
    priceCalculations: OrderItemPrice[];
    errors: Partial<Record<string, string>>;
    /** Prefixo dos ids dos campos, único por formulário. */
    idPrefix: string;
    /** `compact` para diálogos estreitos. */
    size?: 'default' | 'compact';
};

const selectClassName =
    'h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Linhas de itens de um pedido: produto, preço salvo do produto e quantidade,
 * com os erros de validação de cada item. Trocar o produto limpa o preço.
 */
export function OrderItemsEditor({
    items,
    onChange,
    products,
    priceCalculations,
    errors,
    idPrefix,
    size = 'default',
}: Props) {
    function updateItem(index: number, field: EditableField, value: string) {
        onChange(
            items.map((item, itemIndex) =>
                itemIndex === index
                    ? {
                          ...item,
                          [field]: value,
                          ...(field === 'product_id'
                              ? { price_calculation_id: '' }
                              : {}),
                      }
                    : item,
            ),
        );
    }

    function removeItem(index: number) {
        if (items.length === 1) {
            return;
        }

        onChange(items.filter((_, itemIndex) => itemIndex !== index));
    }

    function pricesForProduct(productId: string) {
        return priceCalculations.filter(
            (calculation) => calculation.product_id === Number(productId),
        );
    }

    return items.map((item, index) => (
        <div
            key={index}
            className={cn(
                'grid gap-3 rounded-lg border sm:items-end',
                size === 'compact'
                    ? 'p-3 sm:grid-cols-[1fr_10rem_7rem_auto]'
                    : 'p-4 sm:grid-cols-[1fr_12rem_9rem_auto]',
            )}
        >
            {item.original && item.original.product_id === null ? (
                <div className="grid gap-2">
                    <Label>Produto</Label>
                    <p className="flex min-h-9 flex-col justify-center text-sm">
                        <span>
                            {item.original.product_name} (
                            {item.original.product_sku})
                        </span>
                        <span className="text-xs text-muted-foreground">
                            Produto excluído — o item mantém o que foi gravado.
                        </span>
                    </p>
                </div>
            ) : (
                <div className="grid gap-2">
                    <Label htmlFor={`${idPrefix}-product-${index}`}>
                        Produto
                    </Label>
                    <select
                        id={`${idPrefix}-product-${index}`}
                        required
                        value={item.product_id}
                        onChange={(event) =>
                            updateItem(index, 'product_id', event.target.value)
                        }
                        className={selectClassName}
                    >
                        <option value="">Selecione um produto</option>
                        {products.map((product) => (
                            <option
                                key={product.id}
                                value={product.id}
                                disabled={items.some(
                                    (otherItem, otherIndex) =>
                                        otherIndex !== index &&
                                        Number(otherItem.product_id) ===
                                            product.id,
                                )}
                            >
                                {product.name} ({product.sku})
                                {product.stock !== undefined &&
                                    ` — ${product.stock} em estoque`}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-price-${index}`}>
                    Preço salvo
                </Label>
                <select
                    id={`${idPrefix}-price-${index}`}
                    required={!keepsStoredPrice(item)}
                    disabled={!item.product_id}
                    value={item.price_calculation_id}
                    onChange={(event) =>
                        updateItem(
                            index,
                            'price_calculation_id',
                            event.target.value,
                        )
                    }
                    className={selectClassName}
                >
                    <option value="">
                        {item.original && keepsStoredPrice(item)
                            ? `Preço do pedido: ${formatMoney(item.original.unit_price)}`
                            : item.product_id
                              ? 'Selecione o preço'
                              : 'Selecione o produto'}
                    </option>
                    {pricesForProduct(item.product_id).map((calculation) => (
                        <option key={calculation.id} value={calculation.id}>
                            {formatMoney(calculation.final_price)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-quantity-${index}`}>
                    Quantidade
                </Label>
                <Input
                    id={`${idPrefix}-quantity-${index}`}
                    required
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) =>
                        updateItem(index, 'quantity', event.target.value)
                    }
                />
            </div>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={items.length === 1}
                onClick={() => removeItem(index)}
                aria-label="Remover produto do pedido"
            >
                <X />
            </Button>

            {itemErrors(errors, index).map((message) => (
                <p
                    key={message}
                    className="text-sm text-destructive sm:col-span-4"
                >
                    {message}
                </p>
            ))}
        </div>
    ));
}
