# Spec 12 — Ajustes menores

## 12.1 Relações Eloquent

Hoje só `Sale::items`, `SaleItem::sale` e `SaleItem::product` existem. Adicionar (com generics — ver Spec 03):

- `Product::priceCalculation(): BelongsTo`, `Product::priceCalculations(): HasMany`, `Product::saleItems(): HasMany`
- `PriceCalculation::product(): BelongsTo`, `PriceCalculation::expenseRecord(): BelongsTo`
- `ExpenseRecord::priceCalculations(): HasMany`
- `SaleItem::priceCalculation(): BelongsTo`

Trocar consultas manuais equivalentes pelas relações quando melhorar a leitura, por exemplo `Product::query()->where('price_calculation_id', $id)` → `$priceCalculation->activeProducts()` (relação `HasMany` pela FK `products.price_calculation_id`).

## 12.2 Validação no lugar certo

- `SaleController.php:65-73`: a regra "o preço salvo deve pertencer ao produto" é validação, mas está no controller. Mover para `SaleStoreRequest::after()` (validação pós-regras), com a mensagem indicando o índice do item (`items.{i}.price_calculation_id`) em vez do genérico `items`, para o frontend destacar a linha certa.
- Mesmo tratamento em `ProductController::updatePriceCalculation`: hoje um cálculo de outro produto gera **404**; passar a gerar erro de validação 422 com mensagem, via `ProductPriceCalculationUpdateRequest` com `Rule::exists('price_calculations', 'id')->where('product_id', $product->id)`.
- `SaleStoreRequest::items()` tipado (usado pela Spec 03).

## 12.3 Consistência de URLs

Hoje: `GET calculo-de-preco`, mas `POST/PUT/DELETE calculos-de-preco`; `GET registros-de-vendas`, mas `POST/PUT vendas`.

- Padronizar no plural e usar o mesmo prefixo para tudo do recurso: `calculos-de-preco` e `vendas`.
- Manter as URLs antigas de GET como redirect 301 (`Route::permanentRedirect('calculo-de-preco', 'calculos-de-preco')`, idem `registros-de-vendas` → `vendas`) para não quebrar favoritos.
- **Não** mudar os nomes das rotas (`price-calculations.index`, `sales.index`) → o frontend via Wayfinder continua funcionando; os arquivos de `resources/js/actions` e `resources/js/routes` são regenerados pelo Vite.
- Atualizar as URLs citadas no `CLAUDE.md`.

## 12.4 Estilo dos controllers

- `ProductController`: imports ordenados, remover linha em branco dupla e linha vazia antes do `}` final (coberto pelo Pint na Spec 03).
- `SaleController::saveSale`: remover linha em branco antes do `}` final.

## Critérios de aceite

- Teste: pedido com item cujo `price_calculation_id` é de outro produto → erro em `items.0.price_calculation_id`.
- Teste: `updatePriceCalculation` com cálculo de outro produto → 422 (atualizar o teste da Spec 11 que esperava 404).
- Teste: `GET /calculo-de-preco` e `GET /registros-de-vendas` → 301 para as novas URLs.

## Implementação (2026-10-02)

Concluída.

- **12.1:** relações que faltavam (`Product::priceCalculations/saleItems`, `PriceCalculation::activeProducts`, `ExpenseRecord::priceCalculations`, `SaleItem::priceCalculation`); as de `PriceCalculation::product/expenseRecord` e `Product::priceCalculation` vieram na Spec 06. `PriceCalculation::detachFromActiveProducts()` substitui as duas consultas manuais repetidas no controller.
- **12.2:** `SaleStoreRequest::after()` valida cada item com a chave `items.{i}.price_calculation_id` (antes: `items`, genérico). `ProductPriceCalculationUpdateRequest` usa `Rule::exists(...)->where('product_id', ...)`: cálculo de outro produto passa de 404 a erro de validação com mensagem.
- **Além do previsto:** as telas de pedido (Produtos → Criar pedido, e edição em Vendas) só exibiam `errors.items` — erros por item (incluindo quantidade) nunca apareciam. Agora cada linha mostra os próprios erros (`lib/form-errors.ts`). A troca de preço salvo em Produtos mostra o erro em toast.
- **12.3:** `GET calculos-de-preco` e `GET vendas`; URLs antigas com 301. Nomes das rotas inalterados (Wayfinder regenerado). Links fixos no frontend e `CLAUDE.md` atualizados.
- **12.4:** já resolvido pelo Pint (Spec 03) e pela Spec 02.
