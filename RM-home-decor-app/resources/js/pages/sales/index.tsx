import { Head, useForm } from '@inertiajs/react';
import { Pencil, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { itemErrors } from '@/lib/form-errors';

type SaleItem = {
    id: number;
    product_id: number | null;
    price_calculation_id: number | null;
    product_name: string;
    product_sku: string;
    quantity: number;
    unit_price: string;
    total_amount: string;
};

type Sale = {
    id: number;
    customer_name: string;
    customer_phone: string;
    total_amount: string;
    created_at: string;
    items: SaleItem[];
};

type Props = {
    sales: Sale[];
    products: Product[];
    priceCalculations: PriceCalculation[];
};

type Product = { id: number; name: string; sku: string };
type PriceCalculation = {
    id: number;
    product_id: number | null;
    final_price: string;
};
type EditableItem = {
    product_id: string;
    quantity: string;
    price_calculation_id: string;
};

const money = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

export default function Sales({ sales, products, priceCalculations }: Props) {
    const [editingSale, setEditingSale] = useState<Sale | null>(null);
    const editForm = useForm<{
        customer_name: string;
        customer_phone: string;
        items: EditableItem[];
    }>({
        customer_name: '',
        customer_phone: '',
        items: [],
    });

    function editSale(sale: Sale) {
        editForm.clearErrors();
        editForm.setData({
            customer_name: sale.customer_name,
            customer_phone: sale.customer_phone,
            items: sale.items.map((item) => ({
                product_id: String(item.product_id ?? ''),
                quantity: String(item.quantity),
                price_calculation_id: String(item.price_calculation_id ?? ''),
            })),
        });
        setEditingSale(sale);
    }

    function updateItem(
        index: number,
        field: keyof EditableItem,
        value: string,
    ) {
        editForm.setData(
            'items',
            editForm.data.items.map((item, itemIndex) =>
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

    function addItem() {
        editForm.setData('items', [
            ...editForm.data.items,
            { product_id: '', quantity: '1', price_calculation_id: '' },
        ]);
    }

    function removeItem(index: number) {
        if (editForm.data.items.length === 1) {
            return;
        }

        editForm.setData(
            'items',
            editForm.data.items.filter((_, itemIndex) => itemIndex !== index),
        );
    }

    function pricesForProduct(productId: string) {
        return priceCalculations.filter(
            (calculation) => calculation.product_id === Number(productId),
        );
    }

    function updateSale(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!editingSale) {
            return;
        }

        editForm.put(`/vendas/${editingSale.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditingSale(null),
        });
    }

    return (
        <>
            <Head title="Registros de vendas" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Registros de vendas
                    </h1>
                    <p className="text-muted-foreground">
                        Consulte os pedidos confirmados e seus itens.
                    </p>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-4 py-3 text-left">Data</th>
                                <th className="px-4 py-3 text-left">Cliente</th>
                                <th className="px-4 py-3 text-left">
                                    Telefone
                                </th>
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
                                        Nenhuma venda registrada.
                                    </td>
                                </tr>
                            ) : (
                                sales.map((sale) => (
                                    <tr key={sale.id} className="border-t">
                                        <td className="px-4 py-3 align-top">
                                            {new Date(
                                                sale.created_at,
                                            ).toLocaleString('pt-BR')}
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
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            {money.format(
                                                Number(sale.total_amount),
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => editSale(sale)}
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

                <Dialog
                    open={editingSale !== null}
                    onOpenChange={(open) => {
                        if (!open && !editForm.processing) {
                            setEditingSale(null);
                            editForm.clearErrors();
                        }
                    }}
                >
                    <DialogContent>
                        <form onSubmit={updateSale} className="grid gap-6">
                            <DialogHeader>
                                <DialogTitle>
                                    Editar registro de venda
                                </DialogTitle>
                            </DialogHeader>

                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-customer-name">
                                        Nome do cliente
                                    </Label>
                                    <Input
                                        id="edit-customer-name"
                                        required
                                        value={editForm.data.customer_name}
                                        onChange={(event) =>
                                            editForm.setData(
                                                'customer_name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {editForm.errors.customer_name && (
                                        <p className="text-sm text-destructive">
                                            {editForm.errors.customer_name}
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-customer-phone">
                                        Número de telefone
                                    </Label>
                                    <Input
                                        id="edit-customer-phone"
                                        required
                                        type="tel"
                                        value={editForm.data.customer_phone}
                                        onChange={(event) =>
                                            editForm.setData(
                                                'customer_phone',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {editForm.errors.customer_phone && (
                                        <p className="text-sm text-destructive">
                                            {editForm.errors.customer_phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-3">
                                <div className="flex items-center justify-between">
                                    <Label>Produtos do pedido</Label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={addItem}
                                    >
                                        <Plus />
                                        Adicionar produto
                                    </Button>
                                </div>

                                {editForm.data.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_10rem_7rem_auto] sm:items-end"
                                    >
                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor={`edit-product-${index}`}
                                            >
                                                Produto
                                            </Label>
                                            <select
                                                id={`edit-product-${index}`}
                                                required
                                                value={item.product_id}
                                                onChange={(event) =>
                                                    updateItem(
                                                        index,
                                                        'product_id',
                                                        event.target.value,
                                                    )
                                                }
                                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            >
                                                <option value="">
                                                    Selecione um produto
                                                </option>
                                                {products.map((product) => (
                                                    <option
                                                        key={product.id}
                                                        value={product.id}
                                                        disabled={editForm.data.items.some(
                                                            (
                                                                editItem,
                                                                itemIndex,
                                                            ) =>
                                                                itemIndex !==
                                                                    index &&
                                                                Number(
                                                                    editItem.product_id,
                                                                ) ===
                                                                    product.id,
                                                        )}
                                                    >
                                                        {product.name} (
                                                        {product.sku})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor={`edit-price-${index}`}
                                            >
                                                Preço salvo
                                            </Label>
                                            <select
                                                id={`edit-price-${index}`}
                                                required
                                                disabled={!item.product_id}
                                                value={
                                                    item.price_calculation_id
                                                }
                                                onChange={(event) =>
                                                    updateItem(
                                                        index,
                                                        'price_calculation_id',
                                                        event.target.value,
                                                    )
                                                }
                                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">
                                                    Selecione o preço
                                                </option>
                                                {pricesForProduct(
                                                    item.product_id,
                                                ).map((price) => (
                                                    <option
                                                        key={price.id}
                                                        value={price.id}
                                                    >
                                                        {money.format(
                                                            Number(
                                                                price.final_price,
                                                            ),
                                                        )}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label
                                                htmlFor={`edit-quantity-${index}`}
                                            >
                                                Quantidade
                                            </Label>
                                            <Input
                                                id={`edit-quantity-${index}`}
                                                required
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(event) =>
                                                    updateItem(
                                                        index,
                                                        'quantity',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            disabled={
                                                editForm.data.items.length === 1
                                            }
                                            onClick={() => removeItem(index)}
                                            aria-label="Remover produto"
                                        >
                                            <X />
                                        </Button>

                                        {itemErrors(editForm.errors, index).map(
                                            (message) => (
                                                <p
                                                    key={message}
                                                    className="text-sm text-destructive sm:col-span-4"
                                                >
                                                    {message}
                                                </p>
                                            ),
                                        )}
                                    </div>
                                ))}

                                {editForm.errors.items && (
                                    <p className="text-sm text-destructive">
                                        {editForm.errors.items}
                                    </p>
                                )}
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={editForm.processing}
                                    >
                                        Cancelar
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    disabled={editForm.processing}
                                >
                                    {editForm.processing
                                        ? 'Salvando...'
                                        : 'Salvar alterações'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

Sales.layout = {
    breadcrumbs: [
        {
            title: 'Registros de vendas',
            href: '/vendas',
        },
    ],
};
