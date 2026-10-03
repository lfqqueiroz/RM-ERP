import { router } from '@inertiajs/react';
import { useState } from 'react';
import type {
    CalculationProduct,
    CalculationTrip,
    PriceCalculationRow,
} from '@/components/price-calculations/types';
import { calculateMarkupPrice, fromCents, toCents } from '@/lib/money';
import type { PricingMode } from '@/types';

export type PriceCalculationErrors = Partial<
    Record<
        | 'product_id'
        | 'expense_record_id'
        | 'pricing_mode'
        | 'profit_margin'
        | 'final_price',
        string
    >
>;

/**
 * Estado do formulário de cálculo de preço: seleção, prévia do preço (em
 * centavos, igual ao backend), salvar/editar e erros de validação.
 */
export function usePriceCalculationForm(
    products: CalculationProduct[],
    expenseRecords: CalculationTrip[],
) {
    const [productId, setProductId] = useState('');
    const [expenseRecordId, setExpenseRecordId] = useState('');
    const [pricingMode, setPricingMode] = useState<PricingMode>('margin');
    const [profitMargin, setProfitMargin] = useState('');
    const [manualFinalPrice, setManualFinalPrice] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<PriceCalculationErrors>({});
    const [editingCalculation, setEditingCalculation] =
        useState<PriceCalculationRow | null>(null);

    const selectedProduct = products.find(
        (product) => product.id === Number(productId),
    );
    const selectedExpenseRecord = expenseRecords.find(
        (record) => record.id === Number(expenseRecordId),
    );
    const isManualPrice = pricingMode === 'manual';

    const productCostCents = toCents(selectedProduct?.cost_price ?? '0');
    const tripCostCents = toCents(
        selectedExpenseRecord?.cost_per_product ?? '0',
    );
    const baseCostCents = productCostCents + tripCostCents;
    const finalPriceCents = isManualPrice
        ? toCents(manualFinalPrice || '0')
        : calculateMarkupPrice(baseCostCents, profitMargin || '0');

    const productCost = fromCents(productCostCents);
    const tripCostPerProduct = fromCents(tripCostCents);
    const baseCost = fromCents(baseCostCents);
    const finalPrice = fromCents(finalPriceCents);
    // Markup: quanto o preço acrescenta sobre o custo base.
    // Margem: quanto do preço de venda é lucro. 30% de markup = 23,08% de margem.
    const markupPercent =
        baseCost > 0 && finalPrice > 0
            ? (finalPrice / baseCost - 1) * 100
            : null;
    const marginPercent =
        baseCost > 0 && finalPrice > 0
            ? ((finalPrice - baseCost) / finalPrice) * 100
            : null;

    const hasPricingValue = isManualPrice
        ? manualFinalPrice !== ''
        : profitMargin !== '';
    const canSave = Boolean(
        selectedProduct && selectedExpenseRecord && hasPricingValue,
    );

    function save() {
        if (!selectedProduct || !canSave || isSaving) {
            return;
        }

        setIsSaving(true);
        const payload = {
            product_id: selectedProduct.id,
            expense_record_id: selectedExpenseRecord?.id,
            pricing_mode: pricingMode,
            profit_margin: isManualPrice ? null : profitMargin,
            final_price: isManualPrice ? manualFinalPrice : null,
        };
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setErrors({});
                setEditingCalculation(null);
            },
            onError: (validationErrors: PriceCalculationErrors) =>
                setErrors(validationErrors),
            onFinish: () => setIsSaving(false),
        };

        if (editingCalculation) {
            router.put(
                `/calculos-de-preco/${editingCalculation.id}`,
                payload,
                options,
            );

            return;
        }

        router.post('/calculos-de-preco', payload, options);
    }

    /** Carrega um cálculo salvo no formulário para edição. */
    function edit(calculation: PriceCalculationRow) {
        const isCalculationManual = calculation.pricing_mode === 'manual';

        setProductId(String(calculation.product_id ?? ''));
        setExpenseRecordId(String(calculation.expense_record_id ?? ''));
        setPricingMode(isCalculationManual ? 'manual' : 'margin');
        setProfitMargin(calculation.profit_margin ?? '');
        setManualFinalPrice(isCalculationManual ? calculation.final_price : '');
        setErrors({});
        setEditingCalculation(calculation);
    }

    /** Sai da edição e limpa o formulário. */
    function reset() {
        setEditingCalculation(null);
        setProductId('');
        setExpenseRecordId('');
        setPricingMode('margin');
        setProfitMargin('');
        setManualFinalPrice('');
        setErrors({});
    }

    return {
        productId,
        setProductId,
        expenseRecordId,
        setExpenseRecordId,
        pricingMode,
        setPricingMode,
        profitMargin,
        setProfitMargin,
        manualFinalPrice,
        setManualFinalPrice,
        isManualPrice,
        productCost,
        tripCostPerProduct,
        baseCost,
        finalPrice,
        markupPercent,
        marginPercent,
        canSave,
        isSaving,
        errors,
        editingCalculation,
        save,
        edit,
        reset,
    };
}

export type PriceCalculationForm = ReturnType<typeof usePriceCalculationForm>;
