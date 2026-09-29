# Spec 05 — Usar `minimum_stock`

## Problema

A coluna `products.minimum_stock` (default 0) existe mas:

- não está em `ProductStoreRequest` / `ProductUpdateRequest` nem nos formulários de `products/index.tsx`;
- o alerta do dashboard usa limite fixo: `DashboardController.php:52` → `where('stock', '<=', 2)`.

## Mudanças

1. Validação: adicionar `'minimum_stock' => ['required', 'integer', 'min:0']` nos dois Form Requests de produto.
2. Formulário de cadastro e edição em `products/index.tsx`: campo "Estoque mínimo" (inteiro, ≥ 0). Na edição, preencher com o valor atual.
3. Listagem de produtos: destacar visualmente (badge) produtos com `stock <= minimum_stock`.
4. Dashboard — `stockAlerts`:
   - condição: `whereColumn('stock', '<=', 'minimum_stock')`;
   - retornar também `minimum_stock` e exibir "X de mín. Y" no card;
   - ordenar pela falta (`minimum_stock - stock` desc), depois por nome.
5. Remover o limite fixo `2` e atualizar a descrição do domínio no `CLAUDE.md` (hoje diz "alerta de estoque para `stock <= 2`").

## Decisão (2026-09-29): opção (b)

Produtos já cadastrados têm `minimum_stock = 0`. Para não reduzir o alerta atual, o limite efetivo é:

- `minimum_stock > 0` → alerta quando `stock <= minimum_stock`;
- `minimum_stock = 0` (não configurado) → alerta quando `stock <= 2` (comportamento atual).

Implementar como constante `Product::DEFAULT_MINIMUM_STOCK = 2` e condição `where(fn ($q) => $q->where(fn ($q) => $q->where('minimum_stock', '>', 0)->whereColumn('stock', '<=', 'minimum_stock'))->orWhere(fn ($q) => $q->where('minimum_stock', 0)->where('stock', '<=', Product::DEFAULT_MINIMUM_STOCK)))`. O mesmo limite efetivo vale para o badge da listagem (item 3) e para o "X de mín. Y" do dashboard (exibir "mín. 2 (padrão)" quando não configurado).

Não fazer update em massa no banco para preencher os mínimos.

## Critérios de aceite

- Teste de dashboard: produto com `stock 5, minimum_stock 5` aparece no alerta; `stock 6, minimum_stock 5` não aparece.
- Teste de dashboard: `minimum_stock 0` com `stock 2` aparece; com `stock 3` não aparece.
- Testes de store/update de produto validam `minimum_stock`.
