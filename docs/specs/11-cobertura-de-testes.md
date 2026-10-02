# Spec 11 — Cobertura de testes

## Problema

Só existem testes de feature para `SaleController`, `PriceCalculationController` e `DashboardController`. Não há testes para `ProductController` — incluindo `sell`, **a única baixa de estoque do sistema** — nem para `ExpenseRecordController`. As refatorações das specs 02, 05, 09, 10 e 12 precisam dessa rede de segurança antes.

## Mudanças

Criar factories (se ainda não existirem) para `Product`, `ExpenseRecord`, `PriceCalculation`, `Sale`, `SaleItem` em `database/factories/` — factories não tocam o banco real, só são usadas nos testes em SQLite.

### `tests/Feature/ProductTest.php`

- index exige autenticação e renderiza `products/index` com `products` e `priceCalculations`.
- store: cria produto; rejeita SKU duplicado; rejeita `cost_price`/`stock` negativos.
- update: altera campos; permite manter o próprio SKU; rejeita SKU de outro produto.
- destroy: remove o produto; `sale_items.product_id` e `price_calculations.product_id` viram `null` (snapshot preservado).
- updatePriceCalculation:
  - seleciona um cálculo do próprio produto → `sale_price = final_price` e `price_calculation_id` definido;
  - cálculo de **outro** produto → 404 e produto inalterado;
  - `price_calculation_id` nulo → zera `sale_price` e `price_calculation_id`.
- sell:
  - decrementa `stock` em exatamente 1;
  - com `stock = 0` retorna erro `sale` e não deixa o estoque negativo;
  - não cria `Sale`/`SaleItem` (regra: botão Vender só baixa estoque).

### `tests/Feature/ExpenseRecordTest.php`

- store calcula `total_cost` = soma das 5 despesas e `cost_per_product = total_cost / product_quantity`.
- caso de arredondamento: total 100,00 / 3 produtos → `cost_per_product = 33.33`.
- rejeita `product_quantity = 0` e valores negativos.
- update recalcula `total_cost` e `cost_per_product`.
- destroy remove o registro; `price_calculations.expense_record_id` vira `null` e o snapshot (`expense_record_description`, `trip_cost_per_product`) permanece.

### Complementos em testes existentes

- `SaleTest`: garantir explicitamente que store/update **não alteram** `products.stock` (se ainda não houver assert).
- `PriceCalculationTest`: caso de precisão monetária que hoje depende de `float` (ex.: custo 0,10 + 0,20 com margem 0) — servirá de regressão para a Spec 02.

## Critérios de aceite

- Todos os novos testes passam contra o código atual (são testes de caracterização — se algum falhar, é bug a reportar, não a "corrigir" no teste).
- Nenhum teste usa MySQL.

## Implementação (2026-10-02)

Concluída. Diferenças em relação ao plano:

- **Sem factories.** Os testes seguem o padrão já existente (`Model::create` em helpers privados). Factories exigiriam adicionar `HasFactory` aos models, alterando código de produção numa spec que deveria tocar só `tests/`.
- **`withoutVite()`** nos testes de `index`: a renderização Inertia depende do manifest do Vite; sem isso o teste falha localmente quando `public/build` está desatualizado.
- `SaleTest` já verificava que o pedido não altera `products.stock`; nenhum complemento necessário.
- Nenhum teste de caracterização falhou: o comportamento atual corresponde ao descrito.
