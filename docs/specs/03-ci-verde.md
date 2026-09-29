# Spec 03 — CI verde (Pint + PHPStan)

## Problema

`composer ci:check` falha hoje:

- **Pint** (4 arquivos): `app/Http/Controllers/ProductController.php`, `app/Http/Controllers/SaleController.php`, `routes/web.php`, `tests/Feature/SaleTest.php` — imports fora de ordem, `):RedirectResponse`, vírgula/linha em branco sobrando, `!` sem espaço.
- **PHPStan nível 7** (17 erros):
  - `PriceCalculationController.php:66-67` — `Product::findOrFail($data['product_id'])` com argumento `mixed` é inferido como `Product|Collection<Product>`, gerando 8 erros de propriedade/método indefinido.
  - `SaleController.php:49` — `collect($request->validated('items'))` sem tipo resolvível.
  - `rules()` sem tipo de valor do array em `ExpenseRecordStoreRequest`, `PriceCalculationStoreRequest`, `ProductPriceCalculationUpdateRequest`, `SaleStoreRequest`.
  - `ExpenseRecordController::recordData()` sem tipo de array.
  - Relações sem generics: `Sale::items()`, `SaleItem::sale()`, `SaleItem::product()`.

## Mudanças

1. Rodar `composer lint` (Pint com correção) e revisar o diff — só formatação.
2. PHPStan — corrigir a causa, sem `@phpstan-ignore`, baseline, `assert()` ou `@var` inline:
   - `PriceCalculationController::saveCalculation`: obter IDs como inteiro via `$request->integer('product_id')` / `$request->integer('expense_record_id')` (já validados como `integer|exists`), para que `findOrFail(int)` retorne `Product`/`ExpenseRecord`.
   - `SaleController::saveSale`: extrair `items` tipado. Preferir um método no Form Request (ver Spec 12), p.ex. `SaleStoreRequest::items(): Collection<int, array{product_id:int, quantity:int, price_calculation_id:int}>`, documentado com PHPDoc de retorno.
   - Form Requests: `@return array<string, ValidationRule|array<mixed>|string>` no `rules()` (mesmo padrão já usado em `ProductStoreRequest`).
   - `recordData()`: `@return array<string, mixed>`.
   - Relações: `@return HasMany<SaleItem, $this>` e `@return BelongsTo<Sale, $this>` / `BelongsTo<Product, $this>`.
3. Adicionar PHPDoc `@property` nos models (`Product`, `ExpenseRecord`, `PriceCalculation`, `Sale`, `SaleItem`) com os tipos reais das colunas, para que o Larastan tipifique acessos futuros sem depender de inferência do banco.

## Fora do escopo

Qualquer mudança de comportamento. O diff deve ser neutro para os testes existentes.

## Critérios de aceite

- `composer lint:check` e `composer types:check` passam.
- Os 47 testes atuais continuam passando sem alteração de asserts.
