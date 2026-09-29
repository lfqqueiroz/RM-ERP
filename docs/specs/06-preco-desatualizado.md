# Spec 06 — Aviso de preço desatualizado

## Problema

`PriceCalculation` guarda uma cópia de `product_cost` e `trip_cost_per_product`. Se depois o `products.cost_price` for editado, ou o `expense_records.cost_per_product` mudar (edição do registro de gastos), o `sale_price` do produto continua baseado nos valores antigos, sem nenhum aviso.

O snapshot é intencional e **não deve** ser recalculado automaticamente. Falta só avisar.

## Mudanças

1. Backend — calcular a flag na leitura, sem coluna nova:
   - Relações (Spec 12): `PriceCalculation::product()`, `PriceCalculation::expenseRecord()`, `Product::priceCalculation()`.
   - Accessor ou campo calculado `is_outdated` em `PriceCalculation`:
     - `product` existe e `product.cost_price ≠ product_cost`, **ou**
     - `expenseRecord` existe e `expenseRecord.cost_per_product ≠ trip_cost_per_product`.
   - Comparar com o helper da Spec 02 (centavos), nunca com `float`.
   - Registro de gastos ou produto excluído (FK nula) **não** conta como desatualizado.
   - Carregar com eager loading (`with(['product:id,cost_price', 'expenseRecord:id,cost_per_product'])`) para não gerar N+1.
2. `price-calculations/index.tsx`: badge "Custo alterado" nos cálculos desatualizados, com tooltip "custo no cálculo R$ X → atual R$ Y". Botão de editar recalcula com os valores atuais (o fluxo de edição já relê o produto).
3. `products/index.tsx`: ícone de aviso ao lado do preço de venda quando o cálculo ativo está desatualizado.
4. Dashboard: métrica opcional `outdated_prices` (contagem de produtos com cálculo ativo desatualizado), junto de `without_price`.

## Critérios de aceite

- Teste: criar cálculo, alterar `cost_price` do produto → `is_outdated = true`; editar o cálculo → `false`.
- Teste: excluir registro de gastos → `is_outdated = false`.
- Nenhuma escrita em `products`/`price_calculations` disparada pela verificação.
