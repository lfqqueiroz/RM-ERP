# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão geral

RM ERP: ERP enxuto de estoque e preços para uma loja de decoração. Laravel 13 + Inertia v3 + React 19 + TypeScript + Tailwind 4 (starter kit Laravel com Fortify/passkeys), MySQL 8.4. Todo o código da aplicação fica em `RM-home-decor-app/`; a raiz só tem o `docker-compose.yml` e o README. Interface, rotas (URLs) e mensagens estão em português.

## Regras importantes

- **Não mexer no banco de dados.** O MySQL (volume `mysql_data`) tem dados reais. Não rodar/criar migrations, `migrate*`, seeders, `tinker` com escrita, SQL direto nem `docker compose down -v`. Se uma mudança exigir alteração de schema, descrever a proposta e pedir autorização.
- **Pedido ≠ baixa de estoque.** `SaleController` (`/vendas`, `/registros-de-vendas`) registra apenas encomendas: não altera `products.stock` e pode exceder o saldo. A única baixa de estoque é `ProductController::sell` (botão "Vender", `POST /produtos/{product}/venda`, decrementa 1 unidade). É regra de negócio, não bug.
- Valores monetários são `decimal` (casts `decimal:2`), nunca `float` persistido.

## Comandos

Ambiente via Docker (a partir da raiz `RM-ERP/`). O serviço PHP chama-se `rm-home-decor-app`.

```bash
docker compose up -d            # app em http://localhost:8080, Vite em 5173, MySQL em 127.0.0.1:3307
docker compose logs -f

# Testes (PHPUnit)
docker compose exec rm-home-decor-app php artisan test
docker compose exec rm-home-decor-app php artisan test --filter=SaleTest          # um arquivo/classe
docker compose exec rm-home-decor-app php artisan test --filter=test_nome_metodo  # um método

# PHP: estilo (Pint) e análise estática (Larastan nível 7)
docker compose exec rm-home-decor-app composer lint:check   # ou `composer lint` para corrigir
docker compose exec rm-home-decor-app composer types:check

# Frontend
docker compose exec vite npm run lint:check     # ESLint (`npm run lint` corrige)
docker compose exec vite npm run format:check   # Prettier em resources/
docker compose exec vite npm run types:check    # tsc --noEmit

# Tudo que o CI roda (.github/workflows/tests.yml)
composer ci:check
```

### Testes nunca tocam o MySQL

`phpunit.xml` força SQLite `:memory:` tanto em `<env>` quanto em `<server>` (o docker-compose define `DB_CONNECTION=mysql` em `$_SERVER`, que venceria o `<env>`). `tests/TestCase.php::createApplication` aborta a suíte se a conexão não for `sqlite`/`:memory:`, antes de o `RefreshDatabase` rodar `migrate:fresh`. Não remover essas travas. Se aparecer o erro dessa trava, rodar `php artisan config:clear` (config em cache sobrepõe o phpunit.xml).

## Arquitetura

Fluxo clássico Inertia: rota em `routes/web.php` → controller → `Inertia::render('<pasta>/index', props)` → página em `resources/js/pages/<pasta>/index.tsx`. Mutações retornam `back()->with('success', ...)`; o hook `use-flash-toast` exibe o flash como toast (sonner). Validação fica em Form Requests (`app/Http/Requests`). Não há camada de services: a regra de negócio vive nos controllers, dentro de `DB::transaction`.

Rotas TS tipadas são geradas pelo **Wayfinder** (plugin do Vite) em `resources/js/actions/` e `resources/js/routes/` — arquivos gerados, não editar à mão; ao mudar rotas/controllers eles são regenerados pelo Vite. Componentes shadcn/ui ficam em `resources/js/components/ui/`.

### Domínio e como os módulos se ligam

- **Product** (`produtos`): `cost_price`, `sale_price`, `stock`, `minimum_stock` e `price_calculation_id` (o cálculo de preço ativo).
- **ExpenseRecord** (`registros-de-gastos`): despesas de uma viagem de compra (gasolina, pedágio, manutenção etc.); `cost_per_product` = custo da viagem rateado por produto.
- **PriceCalculation** (`calculo-de-preco`): combina um produto e um registro de gastos. Modo `margin`: `final_price = (cost_price + cost_per_product) * (1 + margem/100)`; modo `manual`: preço digitado. Guarda cópias (snapshot) de nome/custos. Ao salvar, define `product.sale_price`/`price_calculation_id`; ao editar ou excluir um cálculo, os produtos que o usavam têm `price_calculation_id` zerado e `sale_price = 0`.
- **Sale / SaleItem** (`vendas`): encomenda com cliente; cada item referencia um `PriceCalculation` que deve pertencer ao produto, e grava snapshot de `product_name`, `product_sku`, `unit_price`. Itens do mesmo produto são agrupados; editar uma venda apaga e recria os itens.
- **Dashboard**: agrega valor em estoque (`SUM(stock * cost_price)`), vendas por produto e alerta de estoque para `stock <= 2`.

Auth/configurações (login, 2FA, passkeys, perfil) vêm do starter kit via Fortify (`app/Actions/Fortify`, `routes/settings.php`).
