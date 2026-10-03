# Specs de melhoria — RM ERP

Specs derivadas da revisão técnica de 2026-09-29. A numeração segue a revisão original; os itens 1 (cadastro/autorização) e 4 (baixa de estoque do botão "Vender") ficaram de fora porque o comportamento atual é o esperado.

## Restrições que valem para todas as specs

- **Nenhuma alteração de schema, migration, seeder ou dado no MySQL.** Todas as specs abaixo foram escritas para caber no schema atual. Se durante a implementação surgir necessidade de schema, parar e pedir autorização.
- **Pedido ≠ baixa de estoque** (`SaleController` não mexe em `products.stock`). Nenhuma spec muda isso.
- Testes rodam só em SQLite `:memory:`; não remover as travas de `phpunit.xml` / `tests/TestCase.php`.
- Cada spec termina com `composer ci:check` verde (Pint, PHPStan nível 7, PHPUnit, ESLint, Prettier, tsc).

## Status

**Specs 02–12 concluídas** (2026-10-03); specs 13–14 concluídas; 15 (segunda revisão) em aberto. CI verde no GitHub e telas conferidas pelo usuário. Cada spec tem, no fim do arquivo, uma seção **Implementação** com as decisões e diferenças em relação ao plano.

| Ordem | Spec | Tema | Risco | Status | Commit(s) |
|---|---|---|---|---|---|
| 1 | [03 — CI verde](03-ci-verde.md) | Pint + PHPStan | Baixo | ✅ 2026-09-29 | `fe1b331` |
| 2 | [11 — Cobertura de testes](11-cobertura-de-testes.md) | Testes de Product e ExpenseRecord | Baixo | ✅ 2026-10-02 | `2034d4c` |
| 3 | [02 — Aritmética monetária](02-aritmetica-monetaria.md) | Tirar `float` do cálculo de dinheiro | Médio | ✅ 2026-10-02 | `2e4ff8c` |
| 4 | [05 — Estoque mínimo](05-estoque-minimo.md) | Usar `minimum_stock` | Baixo | ✅ 2026-10-02 | `9b74950` |
| 5 | [07 — Dashboard, fuso e idioma](07-dashboard-fuso-idioma.md) | Top produtos, receita mensal, pt_BR | Baixo | ✅ 2026-10-02 | `01e1de7` |
| 6 | [08 — Nomenclatura markup](08-nomenclatura-markup.md) | Textos da tela de cálculo | Baixo | ✅ 2026-10-02 | `a5228ac` |
| 7 | [06 — Preço desatualizado](06-preco-desatualizado.md) | Aviso de custo alterado | Baixo | ✅ 2026-10-02 | `6a7f47e` |
| 8 | [12 — Ajustes menores](12-ajustes-menores.md) | Relações, validação, rotas | Médio (URLs) | ✅ 2026-10-02 | `1b8b1c3` |
| 9 | [10 — Refatoração do frontend](10-refatoracao-frontend.md) | Tipos, `money`, componentes | Médio | ✅ 2026-10-03 | `b92496b` … `15c1869` (5) |
| 10 | [09 — Paginação](09-paginacao.md) | Listagens paginadas | Médio | ✅ 2026-10-03 | `cf70cd3` |

### Segunda revisão (2026-10-03)

| Ordem | Spec | Tema | Risco | Status |
|---|---|---|---|---|
| 11 | [13 — Avisos de sucesso](13-avisos-de-sucesso.md) | Bug: toasts de sucesso nunca aparecem | Baixo | ✅ 2026-10-03 |
| 12 | [14 — Edição de pedidos](14-edicao-de-pedidos.md) | Não repreçar itens ao editar; pedidos com produto excluído | Médio | ✅ 2026-10-03 |
| 13 | [15 — Backup do banco](15-backup-do-banco.md) | `mysqldump` agendado + restauração documentada | Baixo | ⏳ Aberta |

### Fora das specs

| Item | Status | Commit(s) |
|---|---|---|
| CI na raiz do repositório e PHP 8.4 no workflow | ✅ 2026-09-29 | `4f0e51c`, `103db1d` |
| `composer.json` exige PHP `^8.4` (alinhado ao lock) | ✅ 2026-09-29 | `1bb3ba5` |
| Busca por produto em Preços salvos (Cálculo de preço) | ✅ 2026-10-01 | `b06c019`, `ed30dcb` |
| Alertas do `composer audit` (16) e do `npm audit` (3) | ✅ 2026-10-03 | `1073928`, `98f11b9` |

### Pendências conhecidas

- Índices de busca no banco não foram criados (exigiria migration). Propor ao usuário se as buscas ficarem lentas.

## Ordem de execução

Justificativa da ordem: 03 destrava o CI; 11 cria a rede de segurança antes de mexer em cálculo (02) e no frontend (10/09). 09 fica por último porque move busca/ordenação para o servidor e se apoia nos componentes extraídos em 10.
