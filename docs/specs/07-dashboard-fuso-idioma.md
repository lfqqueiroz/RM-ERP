# Spec 07 — Dashboard, fuso horário e idioma

## 7.1 Top produtos agrupado por nome

**Problema:** `DashboardController.php:35-45` agrupa `sale_items` por `product_name, product_sku` (snapshot). Um produto renomeado ou com SKU alterado aparece duas vezes.

**Mudança:**
- Agrupar por `product_id` quando não nulo.
- Nome/SKU exibidos: os **atuais** do produto (`join`/`with` em `products`); se `product_id` for nulo (produto excluído), cair no snapshot, agrupado por `product_name, product_sku` como hoje.
- Implementação sugerida: `groupBy(DB::raw('COALESCE(CAST(product_id AS CHAR), CONCAT(product_name, "|", product_sku))'))` **ou** duas consultas mescladas em PHP — escolher a que funcionar igual em MySQL e SQLite (os testes rodam em SQLite).

**Aceite:** teste com duas vendas do mesmo produto, com o produto renomeado entre elas → uma única linha com a quantidade somada.

## 7.2 Receita mensal no fuso errado

**Problema:** `config/app.php:68` usa `UTC`, e `DashboardController.php:17` faz `now()->startOfMonth()` em UTC. Pedidos feitos entre 21h e 24h (horário de Brasília) do último dia do mês contam no mês seguinte.

**Importante:** a **exibição** de datas está correta — o Laravel serializa `created_at` em ISO-8601 UTC e o `new Date(...).toLocaleDateString('pt-BR')` converte para o fuso do navegador. **Não** trocar `app.timezone`: os `created_at` já gravados estão em UTC e passariam a ser interpretados como horário local (deslocamento de 3h em todo o histórico).

**Mudança:**
- Adicionar `config('app.display_timezone')` (env `APP_DISPLAY_TIMEZONE`, default `America/Sao_Paulo`).
- `$startOfMonth = now(config('app.display_timezone'))->startOfMonth()->utc();`
- Revisar se há outros cortes por data no backend (hoje só este).

**Aceite:** teste com `Carbon::setTestNow('2026-10-01 01:30:00 UTC')` (= 30/09 22:30 em Brasília): pedido criado nesse instante **não** entra na receita de outubro; entra na de setembro.

## 7.3 Mensagens em inglês

**Problema:** `APP_LOCALE=en` e não existe `lang/pt_BR`. As mensagens padrão do Laravel/Fortify (validação, login, reset de senha) aparecem em inglês numa interface em português.

**Mudança:**
- Adicionar traduções pt_BR (`composer require laravel-lang/common --dev` + `php artisan lang:add pt_BR`, ou publicar `lang/pt_BR/*.php` manualmente — preferir o pacote se o Pint/PHPStan não reclamarem).
- `config/app.php`: default de `locale` e `faker_locale` para `pt_BR`/`pt_BR` e `fallback_locale` `en`; atualizar `.env.example`. O `.env` local é do usuário — informar, não editar.
- Traduzir nomes de atributos (`attributes` em `validation.php`) para os campos do domínio: `cost_price` → "preço de custo", `product_quantity` → "quantidade de produtos" etc.

**Aceite:** teste que envia produto sem `name` e verifica mensagem de erro em português.
