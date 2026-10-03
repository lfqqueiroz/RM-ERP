import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { PriceCalculationForm } from '@/components/price-calculations/price-calculation-form';
import { PriceCalculationTable } from '@/components/price-calculations/price-calculation-table';
import type {
    CalculationProduct,
    CalculationTrip,
    PriceCalculationRow,
} from '@/components/price-calculations/types';
import { SearchInput } from '@/components/search-input';
import { usePriceCalculationForm } from '@/hooks/use-price-calculation-form';
import { matchesSearch } from '@/lib/search';

type Props = {
    products: CalculationProduct[];
    expenseRecords: CalculationTrip[];
    priceCalculations: PriceCalculationRow[];
};

export default function PriceCalculations({
    products,
    expenseRecords,
    priceCalculations,
}: Props) {
    const form = usePriceCalculationForm(products, expenseRecords);
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingCalculationId, setDeletingCalculationId] = useState<
        number | null
    >(null);

    const filteredCalculations = priceCalculations.filter((calculation) =>
        matchesSearch(searchQuery, calculation.product_name),
    );

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
                                {searchQuery.trim()
                                    ? `${filteredCalculations.length} de ${priceCalculations.length} ${priceCalculations.length === 1 ? 'preço' : 'preços'}`
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
                        calculations={filteredCalculations}
                        emptyMessage={
                            priceCalculations.length === 0
                                ? 'Nenhum preço salvo.'
                                : 'Nenhum preço encontrado para a pesquisa.'
                        }
                        deletingCalculationId={deletingCalculationId}
                        onEdit={editCalculation}
                        onDelete={deleteCalculation}
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
