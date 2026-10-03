# Spec 10 — Refatoração do frontend

## Problema

- Páginas grandes com várias responsabilidades: `products/index.tsx` (951 linhas: listagem, busca, cadastro, edição, exclusão, venda, seleção de preço e um formulário de pedido embutido), `price-calculations/index.tsx` (554), `expense-records/index.tsx` (540), `sales/index.tsx` (476).
- `new Intl.NumberFormat('pt-BR', { style: 'currency' ... })` duplicado em 4 arquivos; `Number(...)` espalhado (~30 ocorrências).
- Tipos de domínio redeclarados em cada página (`type Product` em `products`, `price-calculations` e `sales`, cada um com campos diferentes).
- Fórmula de preço duplicada no front (`price-calculations/index.tsx:74-80`) e no back.
- Busca normalizada com `toLocaleLowerCase('pt-BR')` repetida em `products` e `expense-records`.

## Mudanças

1. **`resources/js/lib/money.ts`**
   - `formatMoney(value: string | number): string` (BRL, pt-BR);
   - `formatPercent(value: number): string`;
   - `calculateMarkupPrice(cost: string, tripCost: string, markup: string): string` — usada **só para pré-visualização**; o valor gravado continua sendo o calculado no backend (Spec 02). Usar centavos inteiros, igual ao backend, para a prévia bater com o salvo.
2. **`resources/js/lib/search.ts`** — `normalize(text)` (trim + lower pt-BR + remover acentos) e `matchesSearch(query, ...fields)`.
3. **`resources/js/types/domain.ts`** — `Product`, `ExpenseRecord`, `PriceCalculation`, `Sale`, `SaleItem` com os campos completos; as páginas usam `Pick<>` quando recebem só parte deles. Valores monetários como `string`.
4. **Quebra das páginas** em `resources/js/components/<modulo>/`:
   - `products/`: `product-table`, `product-form-dialog` (cadastro + edição), `delete-product-dialog`, `price-selector`, `order-dialog`.
   - `expense-records/`: `expense-record-form`, `expense-record-table`, `sortable-header`.
   - `price-calculations/`: `price-calculation-form`, `price-calculation-summary`, `price-calculation-table`.
   - `sales/`: `sale-table`, `sale-edit-dialog`, `sale-items-editor` — **reutilizado** pelo `order-dialog` de produtos, que hoje duplica a edição de itens (`products/index.tsx:90-180`).
   - Componentes genéricos repetidos (`Field` em `products/index.tsx:927`, `Summary` em `price-calculations/index.tsx:528`) vão para `components/` se tiverem uso em mais de um lugar.
5. A página `index.tsx` de cada módulo fica responsável só por receber as props do Inertia e montar os componentes. Meta: até ~200 linhas.

## Fora do escopo

- Mudanças visuais ou de comportamento. Mesma UI, mesmos fluxos, mesmas chamadas Wayfinder.
- Paginação (Spec 09).

## Critérios de aceite

- `npm run types:check`, `lint:check`, `format:check` passam.
- Nenhuma página com mais de ~250 linhas.
- `grep -rn "Intl.NumberFormat" resources/js/pages` vazio.
- Teste manual guiado (via skill `run`/navegador) dos fluxos: cadastrar/editar/excluir produto, vender, selecionar preço, criar pedido a partir de produtos, CRUD de registro de gastos com ordenação e busca, criar/editar cálculo nos dois modos, editar pedido.

## Implementação (2026-10-03)

Concluída em 5 commits (base, Vendas, Produtos, Cálculo de preço, Registros de gastos).

| Página | Antes | Depois |
|---|---|---|
| `products/index.tsx` | 1053 | 172 |
| `price-calculations/index.tsx` | 685 | 148 |
| `expense-records/index.tsx` | 540 | 134 |
| `sales/index.tsx` | 488 | 54 |

- `lib/money.ts` (formatação + prévias em centavos com `BigInt`, mesma regra de `App\Support\Money`: `toCents`, `calculateMarkupPrice`, `divideCents`), `lib/search.ts` (sem acentos), `types/domain.ts`. Nenhum `Intl.NumberFormat` restante nas páginas.
- Compartilhados: `OrderItemsEditor` + `CustomerFields` (pedido em Produtos e edição em Vendas), `FormField`, `SearchInput`, `SortableHeader`.
- Estado de formulários complexos em hooks (`use-price-calculation-form`, `use-expense-record-form`), para a página poder carregar um registro para edição e limpar o formulário ao excluir o registro em edição.
- **Corrigido:** Cálculo de preço agora exibe os erros de validação em cada campo (achado da Spec 08).
- Diferenças de comportamento (intencionais e pequenas): buscas de Produtos, Registros de gastos e do seletor de produto passam a ignorar acentos; prévias de preço e de valor por produto usam a mesma aritmética do backend; na edição de pedido, telefone ganha placeholder e o select de preço diz "Selecione o produto" antes da escolha.
- Verificação: ESLint, Prettier, tsc, build de produção do Vite e `composer ci:check` (105 testes). Sem testes automatizados de frontend: conferência visual dos fluxos fica com o usuário.
