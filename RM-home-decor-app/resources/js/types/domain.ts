/**
 * Tipos do domínio como o backend os serializa. Valores monetários chegam
 * como string decimal ("80.00", cast `decimal:2`). As páginas usam `Pick<>`
 * quando recebem só parte dos campos.
 */

export type Product = {
    id: number;
    name: string;
    sku: string;
    cost_price: string;
    sale_price: string;
    stock: number;
    minimum_stock: number;
    /** Cálculo de preço ativo (o que define o sale_price). */
    price_calculation_id: number | null;
    created_at: string;
    updated_at: string;
};

export type ExpenseRecord = {
    id: number;
    description: string;
    product_quantity: number;
    fixed_expenses: string;
    gasoline: string;
    vehicle_maintenance: string;
    tolls: string;
    other_variable_expenses: string;
    total_cost: string;
    cost_per_product: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type PricingMode = 'margin' | 'manual';

export type PriceCalculation = {
    id: number;
    product_id: number | null;
    expense_record_id: number | null;
    product_name: string;
    expense_record_description: string;
    pricing_mode: PricingMode;
    product_cost: string;
    trip_cost_per_product: string;
    /** Markup sobre o custo (não a margem sobre a venda); nulo no modo manual. */
    profit_margin: string | null;
    final_price: string;
    created_at: string;
    updated_at: string;
};

export type SaleItem = {
    id: number;
    sale_id: number;
    product_id: number | null;
    price_calculation_id: number | null;
    product_name: string;
    product_sku: string;
    quantity: number;
    unit_price: string;
    total_amount: string;
};

export type Sale = {
    id: number;
    customer_name: string;
    customer_phone: string;
    total_amount: string;
    created_at: string;
    updated_at: string;
    items: SaleItem[];
};
