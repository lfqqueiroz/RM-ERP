import { formatMoney } from '@/lib/money';
import type { ProductPriceOption, ProductRow } from './types';

type Props = {
    product: ProductRow;
    /** Cálculos de preço deste produto. */
    options: ProductPriceOption[];
    disabled: boolean;
    onChange: (priceCalculationId: string) => void;
};

/** Seleciona qual preço salvo define o preço de venda do produto. */
export function PriceSelector({ product, options, disabled, onChange }: Props) {
    return (
        <select
            aria-label={`Selecionar preço salvo para ${product.name}`}
            value={product.price_calculation_id ?? ''}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            className="h-9 min-w-48 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
            <option value="">Sem preço selecionado</option>
            {options.map((calculation) => (
                <option key={calculation.id} value={calculation.id}>
                    {calculation.product_name} —{' '}
                    {formatMoney(calculation.final_price)}
                </option>
            ))}
        </select>
    );
}
