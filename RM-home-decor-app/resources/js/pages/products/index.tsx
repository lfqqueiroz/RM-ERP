import { Head, router } from '@inertiajs/react';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { OrderItemProduct } from '@/components/orders/order-items-editor';
import { Pagination } from '@/components/pagination';
import { DeleteProductDialog } from '@/components/products/delete-product-dialog';
import { OrderDialog } from '@/components/products/order-dialog';
import { ProductCreateForm } from '@/components/products/product-create-form';
import { ProductEditDialog } from '@/components/products/product-edit-dialog';
import { ProductTable } from '@/components/products/product-table';
import type {
    ProductPriceOption,
    ProductRow,
} from '@/components/products/types';
import { SearchInput } from '@/components/search-input';
import { Button } from '@/components/ui/button';
import { useListSearch } from '@/hooks/use-list-search';
import type { ListFilters, Paginated } from '@/types';

type Props = {
    products: Paginated<ProductRow>;
    filters: ListFilters;
    /** Todos os produtos (lista enxuta), para o diálogo de pedido. */
    productOptions: OrderItemProduct[];
    priceCalculations: ProductPriceOption[];
    defaultMinimumStock: number;
};

/** Props recarregadas ao buscar ou trocar de página. */
const LIST_PROPS = ['products', 'filters'];

export default function Products({
    products,
    filters,
    productOptions,
    priceCalculations,
    defaultMinimumStock,
}: Props) {
    const [searchQuery, setSearchQuery] = useListSearch(
        '/produtos',
        filters,
        LIST_PROPS,
    );
    const [editingProduct, setEditingProduct] = useState<ProductRow | null>(
        null,
    );
    const [deletingProduct, setDeletingProduct] = useState<ProductRow | null>(
        null,
    );
    const [isOrderOpen, setIsOrderOpen] = useState(false);
    const [sellingProductId, setSellingProductId] = useState<number | null>(
        null,
    );
    const [updatingPriceProductId, setUpdatingPriceProductId] = useState<
        number | null
    >(null);

    /** Botão "Vender": baixa 1 unidade do estoque (a única baixa do sistema). */
    function sellOneUnit(product: ProductRow) {
        if (product.stock === 0 || sellingProductId !== null) {
            return;
        }

        setSellingProductId(product.id);
        router.post(
            `/produtos/${product.id}/venda`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setSellingProductId(null),
            },
        );
    }

    function selectPrice(product: ProductRow, priceCalculationId: string) {
        setUpdatingPriceProductId(product.id);
        router.put(
            `/produtos/${product.id}/calculo-preco`,
            { price_calculation_id: priceCalculationId || null },
            {
                preserveScroll: true,
                onError: (errors) => {
                    const message = Object.values(errors)[0];

                    if (message) {
                        toast.error(message);
                    }
                },
                onFinish: () => setUpdatingPriceProductId(null),
            },
        );
    }

    return (
        <>
            <Head title="Produtos" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-semibold">Produtos</h1>
                        <p className="text-muted-foreground">
                            Cadastre e consulte os produtos.
                        </p>
                    </div>
                    <Button type="button" onClick={() => setIsOrderOpen(true)}>
                        <ShoppingCart />
                        Criar pedido
                    </Button>
                </div>

                <ProductCreateForm defaultMinimumStock={defaultMinimumStock} />

                <section className="grid gap-3" aria-labelledby="items-title">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h2
                                id="items-title"
                                className="text-lg font-semibold"
                            >
                                Itens cadastrados
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {products.total}{' '}
                                {products.total === 1
                                    ? 'item encontrado'
                                    : 'itens encontrados'}
                            </p>
                        </div>

                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            label="Pesquisar itens cadastrados"
                            placeholder="Pesquisar por nome ou SKU..."
                            className="sm:max-w-md"
                        />
                    </div>

                    <ProductTable
                        products={products.data}
                        priceCalculations={priceCalculations}
                        defaultMinimumStock={defaultMinimumStock}
                        sellingProductId={sellingProductId}
                        updatingPriceProductId={updatingPriceProductId}
                        onSelectPrice={selectPrice}
                        onEdit={setEditingProduct}
                        onDelete={setDeletingProduct}
                        onSell={sellOneUnit}
                    />

                    <Pagination
                        paginator={products}
                        only={LIST_PROPS}
                        itemLabel="produtos"
                    />
                </section>

                <ProductEditDialog
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                    defaultMinimumStock={defaultMinimumStock}
                />

                <DeleteProductDialog
                    product={deletingProduct}
                    onClose={() => setDeletingProduct(null)}
                />

                <OrderDialog
                    open={isOrderOpen}
                    onClose={() => setIsOrderOpen(false)}
                    products={productOptions}
                    priceCalculations={priceCalculations}
                />
            </div>
        </>
    );
}

Products.layout = {
    breadcrumbs: [
        {
            title: 'Produtos',
            href: '/produtos',
        },
    ],
};
