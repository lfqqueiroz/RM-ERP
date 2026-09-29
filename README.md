# RM ERP

ERP enxuto para controle de estoque e valores, construído com Laravel, React,
TypeScript, Inertia e MySQL.

## Requisitos

- Docker com Docker Compose
- Portas `8080`, `5173` e `3307` disponíveis

## Primeira execução

```bash
cp RM-home-decor-app/.env.example RM-home-decor-app/.env
docker compose up -d --build
docker compose exec rm-home-decor-app php artisan key:generate
docker compose exec rm-home-decor-app php artisan migrate --seed
```

A aplicação ficará disponível em <http://localhost:8080>. O Vite usa a porta
`5173` durante o desenvolvimento. Para acessar o MySQL diretamente por uma
ferramenta externa, use `127.0.0.1:3307`; entre os containers ele permanece em
`database:3306`.

Se o arquivo `.env` já existir, ajuste nele estas variáveis:

```dotenv
APP_NAME="RM ERP"
APP_URL=http://localhost:8080
APP_LOCALE=pt_BR
APP_FALLBACK_LOCALE=pt_BR
APP_FAKER_LOCALE=pt_BR

DB_CONNECTION=mysql
DB_HOST=database
DB_PORT=3306
DB_DATABASE=rm_erp
DB_USERNAME=rm_erp
DB_PASSWORD=rm_erp_password
```

## Comandos úteis

```bash
# Iniciar ou parar o ambiente
docker compose up -d
docker compose down

# Acompanhar os serviços
docker compose logs -f

# Executar testes e verificações
# Os testes usam sempre SQLite em memória (forçado no phpunit.xml) e nunca
# tocam no MySQL.
docker compose exec rm-home-decor-app php artisan test
docker compose exec vite npm run lint:check
docker compose exec vite npm run types:check

# Criar uma nova migration
docker compose exec rm-home-decor-app php artisan make:migration create_products_table
```

> Os testes sempre rodam em SQLite em memória: o banco é criado do zero a
> cada teste e descartado ao final, sem ler, limpar ou alterar o MySQL.
> O `phpunit.xml` força essa conexão (em `<env>` e `<server>`, para vencer
> o `DB_CONNECTION=mysql` do docker-compose) e, como segunda camada, o
> `tests/TestCase.php` interrompe a suíte antes de qualquer migração caso a
> conexão não seja `sqlite` com banco `:memory:`.

O volume do MySQL é persistente. `docker compose down` não apaga os dados;
`docker compose down -v` apaga definitivamente o banco local.

## Escopo inicial recomendado

O primeiro módulo deve manter:

- produtos, categorias e unidades de medida;
- saldo atual e estoque mínimo;
- entradas, saídas e ajustes com histórico imutável;
- custo de aquisição, preço de venda e valor total em estoque;
- alertas de estoque baixo e painel resumido.

Valores monetários devem ser armazenados como `decimal`, nunca como `float`.
Movimentações devem ser registradas em transações de banco para manter o saldo
consistente.
