# Spec 15 — Backup do banco de dados

## Problema

O MySQL (volume `mysql_data`) tem os dados reais da loja e não existe rotina de backup. Um `docker compose down -v`, um volume corrompido ou um disco com defeito perdem tudo.

## Restrições

- **O backup só lê o banco** (`mysqldump`). Nenhuma escrita, migration ou SQL de alteração.
- **Restaurar é destrutivo** e substitui os dados atuais: o script de restauração existe, mas só deve ser executado pelo usuário ou com autorização explícita dele. Nunca automatizado.
- Backups contêm dados sensíveis: **nunca** versionados no git.

## Mudanças

1. `scripts/backup-db.sh` (na raiz do `RM-ERP`):
   - `docker compose exec -T -e MYSQL_PWD="$DB_PASSWORD" database mysqldump --single-transaction --routines --triggers --no-tablespaces -u"$DB_USERNAME" "$DB_DATABASE"` — credenciais lidas do `RM-home-decor-app/.env`, nunca escritas no script, e a senha via `MYSQL_PWD` em vez de `-p` (que a deixaria visível na lista de processos);
   - comprime com `gzip` em `backups/rm_erp-AAAA-MM-DD_HHMM.sql.gz`;
   - verifica o arquivo (tamanho > 0, `gzip -t`, presença de `CREATE TABLE \`products\`` e de "Dump completed");
   - apaga backups com mais de **30 dias** (configurável por variável);
   - sai com código de erro se qualquer passo falhar.
2. `scripts/restore-db.sh <arquivo>`: pede confirmação digitando o nome do banco, faz um backup de segurança antes, e restaura. Documentado como uso manual.
3. `.gitignore` na raiz com `backups/`.
4. Agendamento: instruções no README para `crontab -e` (ex.: todo dia às 22h) — **a instalação no crontab do usuário é feita por ele** (ou com autorização).
5. README: seção "Backup e restauração" com os comandos e a recomendação de copiar `backups/` para fora da máquina (nuvem/HD externo).

## Validação (sem tocar no banco real)

Restaurar o dump num **container MySQL descartável** (`docker run --rm mysql:8.4` sem volume persistente), conferir que as tabelas e as contagens de linhas batem com o banco real (contagens obtidas por leitura), e descartar o container.

## Critérios de aceite

- `scripts/backup-db.sh` gera um `.sql.gz` válido e sai com 0; com o banco parado, sai com erro.
- Restauração no container descartável: mesmas tabelas e mesmas contagens de `products`, `sales`, `sale_items`, `price_calculations`, `expense_records`, `users`.
- `git status` não mostra nada em `backups/`.
- README documenta backup, agendamento e restauração (com o aviso de que restaurar substitui os dados).
