import type { PriceCalculationForm } from '@/hooks/use-price-calculation-form';
import { formatMoney, formatPercent } from '@/lib/money';

type Props = Pick<
    PriceCalculationForm,
    | 'productCost'
    | 'tripCostPerProduct'
    | 'baseCost'
    | 'finalPrice'
    | 'markupPercent'
    | 'marginPercent'
>;

/** Prévia do cálculo: custos, preço final, markup e margem sobre a venda. */
export function PriceCalculationSummary({
    productCost,
    tripCostPerProduct,
    baseCost,
    finalPrice,
    markupPercent,
    marginPercent,
}: Props) {
    return (
        <div className="grid gap-4 rounded-lg bg-muted p-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryItem
                label="Preço de custo"
                value={formatMoney(productCost)}
            />
            <SummaryItem
                label="Valor da viagem por produto"
                value={formatMoney(tripCostPerProduct)}
            />
            <SummaryItem label="Custo base" value={formatMoney(baseCost)} />
            <SummaryItem
                label="Preço final"
                value={formatMoney(finalPrice)}
                strong
            />
            <SummaryItem
                label="Markup sobre o custo"
                value={
                    markupPercent === null ? '—' : formatPercent(markupPercent)
                }
            />
            <SummaryItem
                label="Margem sobre a venda"
                value={
                    marginPercent === null ? '—' : formatPercent(marginPercent)
                }
            />
        </div>
    );
}

function SummaryItem({
    label,
    value,
    strong = false,
}: {
    label: string;
    value: string;
    strong?: boolean;
}) {
    return (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={strong ? 'text-xl font-semibold' : 'text-lg'}>
                {value}
            </p>
        </div>
    );
}
