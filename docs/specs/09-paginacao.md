# Spec 09 — Paginação das listagens

## Problema

Todas as páginas carregam tabelas inteiras com `->get()`:

- `ProductController::index` — todos os produtos e todos os cálculos de preço.
- `ExpenseRecordController::index` — todos os registros.
- `PriceCalculationController::index` — todos os produtos, registros e cálculos.
- `SaleController::index` — todos os pedidos **com todos os itens**, mais produtos e cálculos.

A busca (`products`, `expense-records`) e a ordenação (`expense-records`) são feitas no cliente sobre a lista completa. Com o crescimento dos dados, o payload do Inertia e a renderização ficam lentos.

## Mudanças

1. **Listagem principal paginada no servidor** (`->paginate(25)->withQueryString()`):
   - produtos, registros de gastos, cálculos de preço, pedidos.
2. **Busca e ordenação no servidor** via query string (`?busca=&ordem=&direcao=&page=`):
   - produtos: busca em `name`, `sku`;
   - registros de gastos: busca em `description`; ordenação pelas colunas já existentes (`created_at`, `description`, `product_quantity`, `total_cost`, `cost_per_product`) — **whitelist** no controller, nunca repassar a coluna direto para o `orderBy`;
   - pedidos: busca em `customer_name`, `customer_phone`, `sale_items.product_name`.
   - Validação dos parâmetros num Form Request de listagem (ou `$request->validate` com `Rule::in`).
3. **Frontend:**
   - Componente `components/pagination.tsx` (links do paginator do Laravel com `<Link preserveScroll>`).
   - Campo de busca com debounce (~300 ms) que faz `router.get(url, params, { preserveState: true, replace: true })`.
   - Cabeçalhos ordenáveis do `expense-records` passam a alterar a query string.
   - Tipo genérico `Paginated<T>` em `types/`.
4. **Listas de apoio (selects) continuam completas, mas enxutas:** produtos/cálculos usados em selects (`sales`, `price-calculations`, pedido em `products`) mantêm `->get([...colunas mínimas])`. Se crescerem, trocar por busca assíncrona no `product-search-select` já existente — fora do escopo desta spec.
5. **Props parciais do Inertia:** em `sales/index`, usar `Inertia::defer` ou `only` para as listas de apoio, para que paginar/buscar não recarregue produtos e cálculos.
6. Após mutações (`back()`), a página deve voltar com a mesma query string (paginação/busca mantidas) — verificar que o `back()` preserva a URL com parâmetros.

## Critérios de aceite

- Testes de feature: 30 produtos → primeira página com 25 e `links` presentes; busca por SKU retorna só o produto; ordenação inválida → 422 ou ignorada com fallback (definir e testar).
- Busca de pedidos por nome de produto funciona em SQLite e MySQL (usar `whereHas`, sem SQL específico de banco).
- Nenhuma alteração de schema. Se a busca ficar lenta em produção, **propor** índices ao usuário (exige migration → autorização).
