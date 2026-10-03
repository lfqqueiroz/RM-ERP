import { useForm } from '@inertiajs/react';
import { useLayoutEffect } from 'react';
import type { FormEvent } from 'react';
import { FormField } from '@/components/form-field';
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
import type { ProductRow } from './types';

type Props = {
    /** Produto em edição; `null` fecha o diálogo. */
    product: ProductRow | null;
    onClose: () => void;
    defaultMinimumStock: number;
};

export function ProductEditDialog({
    product,
    onClose,
    defaultMinimumStock,
}: Props) {
    const form = useForm({
        name: '',
        sku: '',
        cost_price: '',
        stock: '',
        minimum_stock: '',
    });

    // Preenche antes da pintura, para o diálogo nunca abrir com o produto anterior.
    useLayoutEffect(() => {
        if (!product) {
            return;
        }

        form.clearErrors();
        form.setData({
            name: product.name,
            sku: product.sku,
            cost_price: product.cost_price,
            stock: String(product.stock),
            minimum_stock: String(product.minimum_stock),
        });
        // Recarrega o formulário só quando outro produto é aberto.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product]);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!product) {
            return;
        }

        form.put(`/produtos/${product.id}`, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    }

    return (
        <Dialog
            open={product !== null}
            onOpenChange={(open) => {
                if (!open && !form.processing) {
                    onClose();
                    form.clearErrors();
                }
            }}
        >
            <DialogContent className="sm:max-w-2xl">
                <form onSubmit={submit} className="grid gap-6">
                    <DialogHeader>
                        <DialogTitle>Editar produto</DialogTitle>
                        <DialogDescription>
                            Atualize os dados de {product?.name}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            name="edit_name"
                            label="Nome"
                            value={form.data.name}
                            error={form.errors.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                        />
                        <FormField
                            name="edit_sku"
                            label="Código/SKU"
                            value={form.data.sku}
                            error={form.errors.sku}
                            onChange={(event) =>
                                form.setData('sku', event.target.value)
                            }
                        />
                        <FormField
                            name="edit_cost_price"
                            label="Preço de custo"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.data.cost_price}
                            error={form.errors.cost_price}
                            onChange={(event) =>
                                form.setData('cost_price', event.target.value)
                            }
                        />
                        <FormField
                            name="edit_stock"
                            label="Estoque atual"
                            type="number"
                            min="0"
                            step="1"
                            value={form.data.stock}
                            error={form.errors.stock}
                            onChange={(event) =>
                                form.setData('stock', event.target.value)
                            }
                        />
                        <FormField
                            name="edit_minimum_stock"
                            label="Estoque mínimo"
                            type="number"
                            min="0"
                            step="1"
                            value={form.data.minimum_stock}
                            hint={`Use 0 para o padrão de ${defaultMinimumStock} unidades.`}
                            error={form.errors.minimum_stock}
                            onChange={(event) =>
                                form.setData(
                                    'minimum_stock',
                                    event.target.value,
                                )
                            }
                        />
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
