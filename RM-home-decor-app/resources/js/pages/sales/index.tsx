import { Head } from '@inertiajs/react';
import { useState } from 'react';
import type {
    OrderItemPrice,
    OrderItemProduct,
} from '@/components/orders/order-items-editor';
import { Pagination } from '@/components/pagination';
import { SaleEditDialog } from '@/components/sales/sale-edit-dialog';
import { SaleTable } from '@/components/sales/sale-table';
import { SearchInput } from '@/components/search-input';
import { useListSearch } from '@/hooks/use-list-search';
import type { ListFilters, Paginated, Sale } from '@/types';

type Props = {
    sales: Paginated<Sale>;
    filters: ListFilters;
    products: OrderItemProduct[];
    priceCalculations: OrderItemPrice[];
};

/** Props recarregadas ao buscar ou trocar de página. */
const LIST_PROPS = ['sales', 'filters'];

export default function Sales({
    sales,
    filters,
    products,
    priceCalculations,
}: Props) {
    const [editingSale, setEditingSale] = useState<Sale | null>(null);
    const [searchQuery, setSearchQuery] = useListSearch(
        '/vendas',
        filters,
        LIST_PROPS,
    );

    return (
        <>
            <Head title="Registros de vendas" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Registros de vendas
                        </h1>
                        <p className="text-muted-foreground">
                            Consulte os pedidos confirmados e seus itens.
                        </p>
                    </div>

                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        label="Pesquisar pedidos"
                        placeholder="Pesquisar por cliente, telefone ou produto..."
                        className="sm:max-w-md"
                    />
                </div>

                <SaleTable
                    sales={sales.data}
                    emptyMessage={
                        filters.busca
                            ? 'Nenhum pedido encontrado para a pesquisa.'
                            : 'Nenhuma venda registrada.'
                    }
                    onEdit={setEditingSale}
                />

                <Pagination
                    paginator={sales}
                    only={LIST_PROPS}
                    itemLabel="pedidos"
                />

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
