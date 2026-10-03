import type { PriceCalculation, Product } from '@/types';

/** Produto como a página de Produtos o recebe. */
export type ProductRow = Product & {
    /** O custo mudou desde o cálculo do preço ativo. */
    is_price_outdated: boolean;
};

export type ProductPriceOption = Pick<
    PriceCalculation,
    'id' | 'product_id' | 'product_name' | 'final_price'
>;

/** Estoque mínimo efetivo: o configurado ou, se zero, o padrão do sistema. */
export function effectiveMinimumStock(
    product: Pick<Product, 'minimum_stock'>,
    defaultMinimumStock: number,
): number {
    return product.minimum_stock > 0
        ? product.minimum_stock
        : defaultMinimumStock;
}
