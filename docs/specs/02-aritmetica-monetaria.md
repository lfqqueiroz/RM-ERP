# Spec 02 — Aritmética monetária sem `float`

## Problema

As colunas são `decimal(12,2)` e os models usam `decimal:2`, mas os cálculos convertem para `float`:

- `PriceCalculationController.php:68-78` — `(float) $product->cost_price`, `(float) $expenseRecord->cost_per_product`, `(float) $data['profit_margin']`, `round(..., 2)`.
- `SaleController.php:95-110` — `(float) $priceCalculation->final_price * $item['quantity']` e acumulação `$totalAmount += $itemTotal`.
- `ExpenseRecordController.php:44-55` — `collect([...])->sum()` sobre strings numéricas e divisão `/`.

Além disso, `Product` não tem casts: `cost_price`/`sale_price` chegam ao frontend com tipo inconsistente.

## Decisão técnica

Calcular em **centavos inteiros** com um helper próprio, sem dependência nova: inteiros bastam para as operações do domínio (soma, multiplicação por quantidade inteira, percentual, divisão com arredondamento) e deixam o arredondamento explícito em um único lugar.

Alternativa considerada: `BcMath\Number` (PHP 8.4). Docker e CI rodam 8.4 (o `composer.lock` exige `>=8.4.1`) e a extensão `bcmath` está instalada em ambos, então é viável; porém `composer.json` ainda declara `"php": "^8.3"`, e o helper em centavos não depende disso.

## Mudanças

1. Criar `app/Support/Money.php` (classe final, métodos estáticos puros):
   - `toCents(string|int|float $decimal): int` — parse **por string** (`"12.34"` → `1234`), sem passar por float; aceitar entrada do request (`"12,3"` não precisa ser aceito — o front já envia ponto).
   - `fromCents(int $cents): string` — `1234` → `"12.34"`.
   - `applyPercent(int $cents, string $percent): int` — `cents * (10000 + percent*100) / 10000`, com arredondamento half-up definido explicitamente.
   - `divide(int $cents, int $divisor): int` — divisão com arredondamento half-up.
2. `PriceCalculationController::saveCalculation`: base = `toCents(cost_price) + toCents(cost_per_product)`; margem via `applyPercent`; manual via `toCents(final_price)`. Persistir com `fromCents`.
3. `SaleController::saveSale`: `itemTotal = toCents(final_price) * quantity`; soma em inteiro; persistir com `fromCents`.
4. `ExpenseRecordController::recordData`: somar em centavos; `cost_per_product = divide(total, product_quantity)`.
5. `Product`: adicionar `casts()` com `cost_price`/`sale_price` `decimal:2`, `stock`/`minimum_stock` `integer`, `price_calculation_id` `integer`.
6. Frontend: tipar valores monetários como `string` em todas as páginas (já é o caso na maioria) — a conversão para exibição fica centralizada no `formatMoney` da Spec 10.

## Regra de arredondamento

Half-up em 2 casas, igual ao `round()` atual do PHP para valores positivos — para **não alterar** nenhum preço já calculado. Qualquer diferença em relação ao comportamento atual deve aparecer como teste e ser discutida antes.

## Critérios de aceite

- Nenhum `(float)` ou `floatval` em cálculo monetário em `app/`.
- Testes unitários de `Money` (`tests/Unit/MoneyTest.php`): parse, formatação, percentual com arredondamento (ex.: 10,00 × 33,33% = 13,33), divisão (100,00 / 3 = 33,33), valores zero.
- Testes da Spec 11 continuam passando com os mesmos valores esperados.
- Nenhuma migration.
