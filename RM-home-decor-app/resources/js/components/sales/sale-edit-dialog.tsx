import { useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useLayoutEffect } from 'react';
import type { FormEvent } from 'react';
import { CustomerFields } from '@/components/orders/customer-fields';
import {
    OrderItemsEditor,
    emptyOrderItem,
} from '@/components/orders/order-items-editor';
import type {
    OrderItem,
    OrderItemPrice,
    OrderItemProduct,
} from '@/components/orders/order-items-editor';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { Sale } from '@/types';

type Props = {
    /** Pedido em edição; `null` fecha o diálogo. */
    sale: Sale | null;
    onClose: () => void;
    products: OrderItemProduct[];
    priceCalculations: OrderItemPrice[];
};

export function SaleEditDialog({
    sale,
    onClose,
    products,
    priceCalculations,
}: Props) {
    const form = useForm<{
        customer_name: string;
        customer_phone: string;
        items: OrderItem[];
    }>({
        customer_name: '',
        customer_phone: '',
        items: [],
    });

    // Preenche antes da pintura, para o diálogo nunca abrir com o pedido anterior.
    useLayoutEffect(() => {
        if (!sale) {
            return;
        }

        form.clearErrors();
        form.setData({
            customer_name: sale.customer_name,
            customer_phone: sale.customer_phone,
            items: sale.items.map((item) => ({
                product_id: String(item.product_id ?? ''),
                quantity: String(item.quantity),
                // Vazio = manter o preço gravado; escolher um preço repreça o item.
                price_calculation_id: '',
                original: item,
            })),
        });
        // Recarrega o formulário só quando outro pedido é aberto.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sale]);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!sale) {
            return;
        }

        // Envia só o id do item gravado, não o snapshot usado pela tela.
        form.transform((data) => ({
            ...data,
            items: data.items.map(({ original, ...item }) => ({
                ...item,
                id: original?.id ?? null,
            })),
        }));
        form.put(`/vendas/${sale.id}`, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    }

    return (
        <Dialog
            open={sale !== null}
            onOpenChange={(open) => {
                if (!open && !form.processing) {
                    onClose();
                    form.clearErrors();
                }
            }}
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <form onSubmit={submit} className="grid gap-6">
                    <DialogHeader>
                        <DialogTitle>Editar registro de venda</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <CustomerFields
                            idPrefix="edit"
                            data={form.data}
                            errors={form.errors}
                            onChange={(field, value) =>
                                form.setData(field, value)
                            }
                        />
                    </div>

                    <div className="grid gap-3">
                        <div className="flex items-center justify-between">
                            <Label>Produtos do pedido</Label>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    form.setData('items', [
                                        ...form.data.items,
                                        emptyOrderItem(),
                                    ])
                                }
                            >
                                <Plus />
                                Adicionar produto
                            </Button>
                        </div>

                        <OrderItemsEditor
                            idPrefix="edit"
                            size="compact"
                            items={form.data.items}
                            onChange={(items) => form.setData('items', items)}
                            products={products}
                            priceCalculations={priceCalculations}
                            errors={form.errors}
                        />

                        {form.errors.items && (
                            <p className="text-sm text-destructive">
                                {form.errors.items}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={form.processing}
                            >
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing
                                ? 'Salvando...'
                                : 'Salvar alterações'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
