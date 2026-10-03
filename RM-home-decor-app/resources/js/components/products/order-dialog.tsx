import { useForm } from '@inertiajs/react';
import { Plus, ShoppingCart } from 'lucide-react';
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type Props = {
    open: boolean;
    onClose: () => void;
    products: OrderItemProduct[];
    priceCalculations: OrderItemPrice[];
};

/** Cria um pedido (encomenda). Não baixa estoque. */
export function OrderDialog({
    open,
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
        items: [emptyOrderItem()],
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post('/vendas', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onClose();
            },
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen && !form.processing) {
                    form.reset();
                    form.clearErrors();
                    onClose();
                }
            }}
        >
            <DialogContent className="sm:max-w-2xl">
                <form className="grid gap-6" onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>Criar pedido</DialogTitle>
                        <DialogDescription>
                            Selecione os produtos e as quantidades. Ao
                            confirmar, o pedido será registrado.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <CustomerFields
                            idPrefix="order"
                            data={form.data}
                            errors={form.errors}
                            onChange={(field, value) =>
                                form.setData(field, value)
                            }
                        />
                    </div>

                    <div className="grid gap-4">
                        <OrderItemsEditor
                            idPrefix="order"
                            items={form.data.items}
                            onChange={(items) => form.setData('items', items)}
                            products={products}
                            priceCalculations={priceCalculations}
                            errors={form.errors}
                        />
                    </div>

                    {form.errors.items && (
                        <p className="text-sm text-destructive">
                            {form.errors.items}
                        </p>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        className="w-fit"
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
                            <ShoppingCart />
                            {form.processing
                                ? 'Confirmando...'
                                : 'Confirmar venda'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
