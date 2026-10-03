import { formatMoney } from '@/lib/money';
import type { ExpenseRecord, PriceCalculation, Product } from '@/types';

export type CalculationProduct = Pick<
    Product,
    'id' | 'name' | 'sku' | 'cost_price'
>;

export type CalculationTrip = Pick<
    ExpenseRecord,
    'id' | 'description' | 'cost_per_product' | 'created_at'
>;

/** Cálculo como a página o recebe, com os custos atuais para comparação. */
export type PriceCalculationRow = PriceCalculation & {
    /** O custo do produto ou da viagem mudou desde que o cálculo foi salvo. */
    is_outdated: boolean;
    product: Pick<Product, 'id' | 'cost_price'> | null;
    expense_record: Pick<ExpenseRecord, 'id' | 'cost_per_product'> | null;
};

/** Texto do tooltip do selo "Custo alterado": custo salvo → custo atual. */
export function outdatedCostsDescription(
    calculation: PriceCalculationRow,
): string {
    const changes: string[] = [];

    if (
        calculation.product &&
        Number(calculation.product.cost_price) !==
            Number(calculation.product_cost)
    ) {
        changes.push(
            `Custo do produto: ${formatMoney(calculation.product_cost)} → ${formatMoney(calculation.product.cost_price)}`,
        );
    }

    if (
        calculation.expense_record &&
        Number(calculation.expense_record.cost_per_product) !==
            Number(calculation.trip_cost_per_product)
    ) {
        changes.push(
            `Custo da viagem: ${formatMoney(calculation.trip_cost_per_product)} → ${formatMoney(calculation.expense_record.cost_per_product)}`,
        );
    }

    return `${changes.join('\n')}\nEdite o cálculo para recalcular com os custos atuais.`;
}
