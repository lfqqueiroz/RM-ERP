# Spec 16 — Dependabot para Composer e npm

## Problema

`.github/dependabot.yml` só monitora `github-actions`. As dependências PHP e JavaScript não são acompanhadas, e por isso 16 alertas do `composer audit` e 3 do `npm audit` ficaram sem aviso até a revisão manual de 2026-10-03.

## Mudanças

Acrescentar ao `.github/dependabot.yml` (mantendo o bloco de `github-actions`):

```yaml
  - package-ecosystem: "composer"
    directory: "/RM-home-decor-app"
    schedule:
      interval: "weekly"
    cooldown:
      default-days: 5
    open-pull-requests-limit: 5
    groups:
      composer-minor-patch:
        update-types: ["minor", "patch"]

  - package-ecosystem: "npm"
    directory: "/RM-home-decor-app"
    schedule:
      interval: "weekly"
    cooldown:
      default-days: 5
    open-pull-requests-limit: 5
    groups:
      npm-minor-patch:
        update-types: ["minor", "patch"]
```

- Atualizações minor/patch agrupadas num PR por ecossistema; versões **major** em PRs separados, para avaliação individual (ex.: Guzzle 8, que foi evitado de propósito na correção de segurança).
- **Alertas de segurança** (Dependabot security updates) são independentes do agendamento: ativar em GitHub → Settings → Code security → "Dependabot alerts" e "Dependabot security updates" — **feito pelo usuário** no GitHub.
- Os PRs disparam o CI existente (`on: pull_request`), que valida Pint, PHPStan, testes, ESLint, Prettier, tsc e build.

## Cuidados

- O Composer roda no ambiente do Dependabot, não no container: confirmar que os PRs respeitam `"php": "^8.4"` (o `composer.json` já declara; se necessário, acrescentar `config.platform.php` = `8.4` no `composer.json` para fixar a resolução).
- O npm do Dependabot pode alterar o campo cosmético `"name"` do `package-lock.json` (hoje `"www"`); se aparecer nos PRs, alinhar com `"name"` no `package.json`.
- Nenhuma atualização é mesclada automaticamente: cada PR é revisado e mesclado pelo usuário.

## Critérios de aceite

- `dependabot.yml` válido (a aba Insights → Dependency graph → Dependabot do GitHub mostra os três ecossistemas sem erro).
- Primeiro ciclo semanal abre PRs com CI verde, ou falhas documentadas.
- README da raiz menciona como revisar os PRs do Dependabot.
