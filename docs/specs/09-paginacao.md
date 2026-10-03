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

## Implementação (2026-10-03)

Concluída. Decisões:

- `App\Support\ListQuery`: lê `busca`, `ordem`, `direcao` da URL; ordem/direção inválidas **caem no padrão** (sem 422), para URLs editadas à mão continuarem abrindo. Ordenação só por whitelist (`ExpenseRecordController::SORTABLE`).
- Parâmetro de página em português: `?pagina=` (as URLs do sistema são em português), 25 por página, `withQueryString()`.
- Página além da última (ex.: excluiu o último item da página) redireciona para a última página existente.
- Listas de apoio dos selects continuam completas e enxutas, como **closures**: em recargas parciais (`only`) não são recalculadas no servidor (coberto em teste). Produtos ganhou a prop `productOptions` (todos os produtos) para o diálogo de pedido, já que `products` agora é só a página atual.
- Busca no servidor com `LIKE`; no MySQL (`utf8mb4_unicode_ci`) ignora acentos e maiúsculas — validado com leitura no banco real. `%`/`_` digitados funcionam como curingas (valor sempre como parâmetro).
- Vendas ganhou campo de busca (cliente, telefone ou produto dos itens, via `whereHas`).
- Frontend: `Paginated<T>`, componente `Pagination` (resumo "1–25 de 71" + páginas), hook `useListSearch` (debounce de 300 ms), `visitList` (recarga parcial). A ordenação de Registros de gastos passou para o servidor; `sorting.ts` (ordenação no cliente) removido.
- Índices: não criados (exigiria migration). Com os volumes atuais (71 produtos, 61 cálculos, 11 pedidos) não há necessidade; se a busca ficar lenta, propor índices ao usuário.
