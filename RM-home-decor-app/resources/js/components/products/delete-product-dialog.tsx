import { router } from '@inertiajs/react';
import { Trash2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
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
    /** Produto a excluir; `null` fecha o diálogo. */
    product: ProductRow | null;
    onClose: () => void;
};

export function DeleteProductDialog({ product, onClose }: Props) {
    const [processing, setProcessing] = useState(false);

    function deleteProduct() {
        if (!product || processing) {
            return;
        }

        setProcessing(true);
        router.delete(`/produtos/${product.id}`, {
            preserveScroll: true,
            onSuccess: onClose,
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <Dialog
            open={product !== null}
            onOpenChange={(open) => {
                if (!open && !processing) {
                    onClose();
                }
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <TriangleAlert className="size-5" />
                    </div>
                    <DialogTitle>Excluir produto?</DialogTitle>
                    <DialogDescription>
                        O produto{' '}
                        <strong className="text-foreground">
                            {product?.name}
                        </strong>{' '}
                        será removido permanentemente. Essa ação não poderá ser
                        desfeita.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={processing}
                        >
                            Cancelar
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={processing}
                        onClick={deleteProduct}
                    >
                        <Trash2 />
                        {processing
                            ? 'Excluindo...'
                            : 'Excluir definitivamente'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
