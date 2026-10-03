import { Head } from '@inertiajs/react';
import { useState } from 'react';
import type {
    OrderItemPrice,
    OrderItemProduct,
} from '@/components/orders/order-items-editor';
import { SaleEditDialog } from '@/components/sales/sale-edit-dialog';
import { SaleTable } from '@/components/sales/sale-table';
import type { Sale } from '@/types';

type Props = {
    sales: Sale[];
    products: OrderItemProduct[];
    priceCalculations: OrderItemPrice[];
};

export default function Sales({ sales, products, priceCalculations }: Props) {
    const [editingSale, setEditingSale] = useState<Sale | null>(null);

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

                <SaleTable sales={sales} onEdit={setEditingSale} />

                <SaleEditDialog
                    sale={editingSale}
                    onClose={() => setEditingSale(null)}
                    products={products}
                    priceCalculations={priceCalculations}
                />
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
