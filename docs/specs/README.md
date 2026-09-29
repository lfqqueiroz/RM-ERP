# Specs de melhoria — RM ERP

Specs derivadas da revisão técnica de 2026-09-29. A numeração segue a revisão original; os itens 1 (cadastro/autorização) e 4 (baixa de estoque do botão "Vender") ficaram de fora porque o comportamento atual é o esperado.

## Restrições que valem para todas as specs

- **Nenhuma alteração de schema, migration, seeder ou dado no MySQL.** Todas as specs abaixo foram escritas para caber no schema atual. Se durante a implementação surgir necessidade de schema, parar e pedir autorização.
- **Pedido ≠ baixa de estoque** (`SaleController` não mexe em `products.stock`). Nenhuma spec muda isso.
- Testes rodam só em SQLite `:memory:`; não remover as travas de `phpunit.xml` / `tests/TestCase.php`.
- Cada spec termina com `composer ci:check` verde (Pint, PHPStan nível 7, PHPUnit, ESLint, Prettier, tsc).

## Índice e ordem sugerida

| Ordem | Spec | Tema | Risco |
|---|---|---|---|
| 1 | [03 — CI verde](03-ci-verde.md) | Pint + PHPStan | Baixo |
| 2 | [11 — Cobertura de testes](11-cobertura-de-testes.md) | Testes de Product e ExpenseRecord | Baixo |
| 3 | [02 — Aritmética monetária](02-aritmetica-monetaria.md) | Tirar `float` do cálculo de dinheiro | Médio |
| 4 | [05 — Estoque mínimo](05-estoque-minimo.md) | Usar `minimum_stock` | Baixo |
| 5 | [07 — Dashboard, fuso e idioma](07-dashboard-fuso-idioma.md) | Top produtos, receita mensal, pt_BR | Baixo |
| 6 | [08 — Nomenclatura markup](08-nomenclatura-markup.md) | Textos da tela de cálculo | Baixo |
| 7 | [06 — Preço desatualizado](06-preco-desatualizado.md) | Aviso de custo alterado | Baixo |
| 8 | [12 — Ajustes menores](12-ajustes-menores.md) | Relações, validação, rotas | Médio (URLs) |
| 9 | [10 — Refatoração do frontend](10-refatoracao-frontend.md) | Tipos, `money`, componentes | Médio |
| 10 | [09 — Paginação](09-paginacao.md) | Listagens paginadas | Médio |

Justificativa da ordem: 03 destrava o CI; 11 cria a rede de segurança antes de mexer em cálculo (02) e no frontend (10/09). 09 fica por último porque move busca/ordenação para o servidor e se apoia nos componentes extraídos em 10.
