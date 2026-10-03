import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Pagination } from '@/components/pagination';
import { PriceCalculationForm } from '@/components/price-calculations/price-calculation-form';
import { PriceCalculationTable } from '@/components/price-calculations/price-calculation-table';
import type {
    CalculationProduct,
    CalculationTrip,
    PriceCalculationRow,
} from '@/components/price-calculations/types';
import { SearchInput } from '@/components/search-input';
import { useListSearch } from '@/hooks/use-list-search';
import { usePriceCalculationForm } from '@/hooks/use-price-calculation-form';
import type { ListFilters, Paginated } from '@/types';

type Props = {
    products: CalculationProduct[];
    expenseRecords: CalculationTrip[];
    priceCalculations: Paginated<PriceCalculationRow>;
    filters: ListFilters;
};

/** Props recarregadas ao buscar ou trocar de página. */
const LIST_PROPS = ['priceCalculations', 'filters'];

export default function PriceCalculations({
    products,
    expenseRecords,
    priceCalculations,
    filters,
}: Props) {
    const form = usePriceCalculationForm(products, expenseRecords);
    const [searchQuery, setSearchQuery] = useListSearch(
        '/calculos-de-preco',
        filters,
        LIST_PROPS,
    );
    const [deletingCalculationId, setDeletingCalculationId] = useState<
        number | null
    >(null);

    function editCalculation(calculation: PriceCalculationRow) {
        form.edit(calculation);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function deleteCalculation(calculation: PriceCalculationRow) {
        if (
            deletingCalculationId !== null ||
            !window.confirm(
                `Excluir o preço salvo de “${calculation.product_name}”?`,
            )
        ) {
            return;
        }

        setDeletingCalculationId(calculation.id);
        router.delete(`/calculos-de-preco/${calculation.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                if (form.editingCalculation?.id === calculation.id) {
                    form.reset();
                }
            },
            onFinish: () => setDeletingCalculationId(null),
        });
    }

    return (
        <>
            <Head title="Cálculo de preço" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">
                        {form.editingCalculation
                            ? 'Editar preço salvo'
                            : 'Cálculo de preço'}
                    </h1>
                    <p className="text-muted-foreground">
                        Defina o preço de venda com base no custo do produto, na
                        viagem e no markup desejado — ou informe o valor final
                        manualmente.
                    </p>
                </div>

                <PriceCalculationForm
                    form={form}
                    products={products}
                    expenseRecords={expenseRecords}
                />

                {!expenseRecords.length && (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        Cadastre uma viagem em Registros de gastos para usar o
                        valor por produto no cálculo.
                    </p>
                )}

                <section
                    className="grid gap-3"
                    aria-labelledby="saved-prices-title"
                >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2
                                id="saved-prices-title"
                                className="text-lg font-semibold"
                            >
                                Preços salvos
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {filters.busca
                                    ? `${priceCalculations.total} ${priceCalculations.total === 1 ? 'preço encontrado' : 'preços encontrados'}`
                                    : 'Histórico dos preços calculados.'}
                            </p>
                        </div>

                        <SearchInput
                            id="saved-prices-search"
                            visibleLabel="Produto"
                            label="Pesquisar preços salvos por produto"
                            placeholder="Pesquisar por produto..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            className="sm:w-auto"
                            fieldClassName="sm:w-64"
                        />
                    </div>

                    <PriceCalculationTable
                        calculations={priceCalculations.data}
                        emptyMessage={
                            filters.busca
                                ? 'Nenhum preço encontrado para a pesquisa.'
                                : 'Nenhum preço salvo.'
                        }
                        deletingCalculationId={deletingCalculationId}
                        onEdit={editCalculation}
                        onDelete={deleteCalculation}
                    />

                    <Pagination
                        paginator={priceCalculations}
                        only={LIST_PROPS}
                        itemLabel="preços"
                    />
                </section>
            </div>
        </>
    );
}

PriceCalculations.layout = {
    breadcrumbs: [
        {
            title: 'Cálculo de preço',
            href: '/calculos-de-preco',
        },
    ],
};
