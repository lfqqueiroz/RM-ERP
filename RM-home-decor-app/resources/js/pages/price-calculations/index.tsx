import { Head, router } from '@inertiajs/react';
import { Calculator, Pencil, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ProductSearchSelect } from '@/components/product-search-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type Product = {
    id: number;
    name: string;
    sku: string;
    cost_price: string;
};

type ExpenseRecord = {
    id: number;
    description: string;
    cost_per_product: string;
    created_at: string;
};

type Props = {
    products: Product[];
    expenseRecords: ExpenseRecord[];
    priceCalculations: PriceCalculation[];
};

type PricingMode = 'margin' | 'manual';

type PriceCalculation = {
    id: number;
    product_id: number | null;
    expense_record_id: number | null;
    product_name: string;
    expense_record_description: string;
    pricing_mode: PricingMode;
    product_cost: string;
    trip_cost_per_product: string;
    profit_margin: string | null;
    final_price: string;
    created_at: string;
};

const money = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

function normalizeSearchText(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR');
}

export default function PriceCalculations({
    products,
    expenseRecords,
    priceCalculations,
}: Props) {
    const [productId, setProductId] = useState('');
    const [expenseRecordId, setExpenseRecordId] = useState('');
    const [pricingMode, setPricingMode] = useState<PricingMode>('margin');
    const [profitMargin, setProfitMargin] = useState('');
    const [manualFinalPrice, setManualFinalPrice] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [editingCalculation, setEditingCalculation] =
        useState<PriceCalculation | null>(null);
    const [deletingCalculationId, setDeletingCalculationId] = useState<
        number | null
    >(null);
    const [searchQuery, setSearchQuery] = useState('');

    const selectedProduct = products.find(
        (product) => product.id === Number(productId),
    );
    const selectedExpenseRecord = expenseRecords.find(
        (record) => record.id === Number(expenseRecordId),
    );
    const productCost = Number(selectedProduct?.cost_price ?? 0);
    const tripCostPerProduct = Number(
        selectedExpenseRecord?.cost_per_product ?? 0,
    );
    const baseCost = productCost + tripCostPerProduct;
    const isManualPrice = pricingMode === 'manual';
    const margin = Number(profitMargin) || 0;
    const manualPrice = Number(manualFinalPrice) || 0;
    const finalPrice = isManualPrice
        ? manualPrice
        : baseCost * (1 + margin / 100);
    const resultingMargin =
        isManualPrice && baseCost > 0 ? (manualPrice / baseCost - 1) * 100 : 0;
    const hasPricingValue = isManualPrice
        ? manualFinalPrice !== ''
        : profitMargin !== '';
    const canCalculate = Boolean(
        selectedProduct && selectedExpenseRecord && hasPricingValue,
    );

    const normalizedSearchQuery = normalizeSearchText(searchQuery.trim());
    const filteredCalculations = priceCalculations.filter((calculation) =>
        normalizeSearchText(calculation.product_name).includes(
            normalizedSearchQuery,
        ),
    );

    function saveSalePrice() {
        if (!selectedProduct || !canCalculate || isSaving) {
            return;
        }

        setIsSaving(true);
        const url = editingCalculation
            ? `/calculos-de-preco/${editingCalculation.id}`
            : '/calculos-de-preco';

        const payload = {
            product_id: selectedProduct.id,
            expense_record_id: selectedExpenseRecord?.id,
            pricing_mode: pricingMode,
            profit_margin: isManualPrice ? null : profitMargin,
            final_price: isManualPrice ? manualFinalPrice : null,
        };

        const options = {
            preserveScroll: true,
            onSuccess: () => setEditingCalculation(null),
            onFinish: () => setIsSaving(false),
        };

        if (editingCalculation) {
            router.put(url, payload, options);

            return;
        }

        router.post(url, payload, options);
    }

    function editCalculation(calculation: PriceCalculation) {
        const isCalculationManual = calculation.pricing_mode === 'manual';

        setProductId(String(calculation.product_id ?? ''));
        setExpenseRecordId(String(calculation.expense_record_id ?? ''));
        setPricingMode(isCalculationManual ? 'manual' : 'margin');
        setProfitMargin(calculation.profit_margin ?? '');
        setManualFinalPrice(isCalculationManual ? calculation.final_price : '');
        setEditingCalculation(calculation);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function cancelEditing() {
        setEditingCalculation(null);
        setProductId('');
        setExpenseRecordId('');
        setPricingMode('margin');
        setProfitMargin('');
        setManualFinalPrice('');
    }

    function deleteCalculation(calculation: PriceCalculation) {
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
                if (editingCalculation?.id === calculation.id) {
                    cancelEditing();
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
                        {editingCalculation
                            ? 'Editar preço salvo'
                            : 'Cálculo de preço'}
                    </h1>
                    <p className="text-muted-foreground">
                        Defina o preço de venda com base no custo do produto, na
                        viagem e na margem de lucro desejada — ou informe o
                        valor final manualmente.
                    </p>
                </div>

                <div className="grid gap-6 rounded-xl border p-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="grid gap-2">
                            <Label htmlFor="calculation-product">Produto</Label>
                            <ProductSearchSelect
                                id="calculation-product"
                                products={products}
                                value={productId}
                                onChange={setProductId}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="calculation-trip">Viagem</Label>
                            <select
                                id="calculation-trip"
                                value={expenseRecordId}
                                onChange={(event) =>
                                    setExpenseRecordId(event.target.value)
                                }
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <option value="">Selecione a viagem</option>
                                {expenseRecords.map((record) => (
                                    <option key={record.id} value={record.id}>
                                        {record.description} —{' '}
                                        {new Date(
                                            record.created_at,
                                        ).toLocaleDateString('pt-BR')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Forma de cálculo do preço</Label>
                            <ToggleGroup
                                type="single"
                                variant="outline"
                                value={pricingMode}
                                onValueChange={(value) => {
                                    if (value) {
                                        setPricingMode(value as PricingMode);
                                    }
                                }}
                                className="w-full"
                            >
                                <ToggleGroupItem
                                    value="margin"
                                    className="flex-1"
                                >
                                    Porcentagem (%)
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                    value="manual"
                                    className="flex-1"
                                >
                                    Valor final (R$)
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                    </div>

                    <div className="grid gap-2 sm:max-w-xs">
                        {isManualPrice ? (
                            <>
                                <Label htmlFor="manual-final-price">
                                    Preço final desejado (R$)
                                </Label>
                                <Input
                                    id="manual-final-price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={manualFinalPrice}
                                    onChange={(event) =>
                                        setManualFinalPrice(event.target.value)
                                    }
                                    placeholder="Ex.: 199,90"
                                />
                            </>
                        ) : (
                            <>
                                <Label htmlFor="profit-margin">
                                    Margem de lucro desejada (%)
                                </Label>
                                <Input
                                    id="profit-margin"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={profitMargin}
                                    onChange={(event) =>
                                        setProfitMargin(event.target.value)
                                    }
                                    placeholder="Ex.: 30"
                                />
                            </>
                        )}
                    </div>

                    <div className="grid gap-4 rounded-lg bg-muted p-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Summary label="Preço de custo" value={productCost} />
                        <Summary
                            label="Valor da viagem por produto"
                            value={tripCostPerProduct}
                        />
                        <Summary label="Custo base" value={baseCost} />
                        <Summary
                            label="Preço final"
                            value={finalPrice}
                            strong
                        />
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            {isManualPrice ? (
                                <>
                                    Preço final informado manualmente, sem
                                    aplicar margem sobre o custo base.
                                    {manualFinalPrice !== '' &&
                                        baseCost > 0 && (
                                            <>
                                                {' '}
                                                Margem resultante:{' '}
                                                {resultingMargin.toLocaleString(
                                                    'pt-BR',
                                                    {
                                                        maximumFractionDigits: 2,
                                                    },
                                                )}
                                                %.
                                            </>
                                        )}
                                </>
                            ) : (
                                <>
                                    Fórmula: (preço de custo + valor por produto
                                    da viagem) × (1 + margem de lucro ÷ 100).
                                </>
                            )}
                        </p>
                        <Button
                            type="button"
                            disabled={!canCalculate || isSaving}
                            onClick={saveSalePrice}
                        >
                            <Calculator />
                            {isSaving
                                ? 'Salvando...'
                                : editingCalculation
                                  ? 'Salvar alterações'
                                  : 'Salvar preço de venda'}
                        </Button>
                        {editingCalculation && (
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isSaving}
                                onClick={cancelEditing}
                            >
                                Cancelar edição
                            </Button>
                        )}
                    </div>
                </div>

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
                                {normalizedSearchQuery
                                    ? `${filteredCalculations.length} de ${priceCalculations.length} ${priceCalculations.length === 1 ? 'preço' : 'preços'}`
                                    : 'Histórico dos preços calculados.'}
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                            <div className="grid gap-1 sm:w-64">
                                <Label htmlFor="saved-prices-search">
                                    Produto
                                </Label>
                                <div className="relative">
                                    <Search
                                        aria-hidden="true"
                                        className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                                    />
                                    <Input
                                        id="saved-prices-search"
                                        placeholder="Pesquisar por produto..."
                                        value={searchQuery}
                                        onChange={(event) =>
                                            setSearchQuery(event.target.value)
                                        }
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            {searchQuery && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-9 px-3"
                                    onClick={() => setSearchQuery('')}
                                >
                                    Limpar
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        Data
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Produto
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Viagem
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Custo do produto
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Custo da viagem
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Margem
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Preço final
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCalculations.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            {priceCalculations.length === 0
                                                ? 'Nenhum preço salvo.'
                                                : 'Nenhum preço encontrado para a pesquisa.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCalculations.map((calculation) => (
                                        <tr
                                            key={calculation.id}
                                            className="border-t"
                                        >
                                            <td className="px-4 py-3">
                                                {new Date(
                                                    calculation.created_at,
                                                ).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-4 py-3">
                                                {calculation.product_name}
                                            </td>
                                            <td className="px-4 py-3">
                                                {
                                                    calculation.expense_record_description
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {money.format(
                                                    Number(
                                                        calculation.product_cost,
                                                    ),
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {money.format(
                                                    Number(
                                                        calculation.trip_cost_per_product,
                                                    ),
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {calculation.profit_margin ===
                                                null ? (
                                                    <span
                                                        className="text-muted-foreground"
                                                        title="Preço definido manualmente"
                                                    >
                                                        —
                                                    </span>
                                                ) : (
                                                    <>
                                                        {Number(
                                                            calculation.profit_margin,
                                                        ).toLocaleString(
                                                            'pt-BR',
                                                        )}
                                                        %
                                                    </>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {money.format(
                                                    Number(
                                                        calculation.final_price,
                                                    ),
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            editCalculation(
                                                                calculation,
                                                            )
                                                        }
                                                    >
                                                        <Pencil />
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="destructive"
                                                        disabled={
                                                            deletingCalculationId !==
                                                            null
                                                        }
                                                        onClick={() =>
                                                            deleteCalculation(
                                                                calculation,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 />
                                                        {deletingCalculationId ===
                                                        calculation.id
                                                            ? 'Excluindo...'
                                                            : 'Excluir'}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </>
    );
}

function Summary({
    label,
    value,
    strong = false,
}: {
    label: string;
    value: number;
    strong?: boolean;
}) {
    return (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={strong ? 'text-xl font-semibold' : 'text-lg'}>
                {money.format(value)}
            </p>
        </div>
    );
}

PriceCalculations.layout = {
    breadcrumbs: [
        {
            title: 'Cálculo de preço',
            href: '/calculo-de-preco',
        },
    ],
};
