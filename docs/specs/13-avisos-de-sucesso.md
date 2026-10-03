# Spec 13 — Avisos de sucesso e erro nas telas do ERP

## Problema (bug confirmado)

O frontend exibe avisos (toast) só para mensagens enviadas com `Inertia::flash('toast', [...])`: o hook `resources/js/hooks/use-flash-toast.ts` escuta o evento `flash` do Inertia e lê `flash.toast`. Só as telas de configurações usam esse formato (`Settings/ProfileController.php:41`, `Settings/SecurityController.php:62`).

Os controllers do ERP usam `back()->with('success', ...)`, que é flash comum de sessão — o `HandleInertiaRequests` não o compartilha e o frontend não o lê. Teste de sondagem (2026-10-03): depois de cadastrar um produto, a página seguinte tem `flash: null`. **Nenhuma das 15 mensagens de sucesso do ERP aparece.**

| Controller | Mensagens |
|---|---|
| `ProductController` | cadastrado, atualizado, excluído, preço salvo removido, preço salvo selecionado, venda registrada (botão Vender) |
| `PriceCalculationController` | calculado e salvo, atualizado, excluído |
| `SaleController` | venda registrada, venda atualizada |
| `ExpenseRecordController` | salvo, atualizado, excluído |

Além disso, `ProductController::sell` devolve o erro de estoque vazio com `withErrors(['sale' => ...])`, e a tela de Produtos não exibe `errors.sale` (raro hoje: o botão fica desabilitado com estoque 0, mas pode acontecer com duas abas abertas).

## Mudanças

1. Em `app/Http/Controllers/Controller.php`, um helper protegido:
   ```php
   protected function toast(string $message, string $type = 'success'): void
   {
       Inertia::flash('toast', ['type' => $type, 'message' => $message]);
   }
   ```
   (`$type` documentado como `'success'|'info'|'warning'|'error'`, igual a `FlashToast` em `resources/js/types/ui.ts`.)
2. Trocar as 15 ocorrências de `back()->with('success', $msg)` por `$this->toast($msg); return back();`. Padronizar o ponto final ("Produto cadastrado com sucesso" está sem ponto).
3. `ProductController::sell` com estoque vazio: `$this->toast("O produto {$product->name} está com o estoque vazio.", 'error'); return back();` em vez de `withErrors` — erro de regra de negócio, não de campo de formulário.
4. Nenhuma mudança no frontend: o hook e o `<Toaster />` já existem e funcionam (comprovado pelas telas de configurações).

## Fora do escopo

Mensagens de erro de validação de campos (continuam nos formulários, como hoje).

## Critérios de aceite

- Teste para cada ação de cada controller: `->assertInertiaFlash('toast.type', 'success')` e `->assertInertiaFlash('toast.message', '...')` (macro do `inertia-laravel`).
- Teste: Vender com estoque 0 → `toast.type = error`; estoque continua 0.
- `grep -rn "with('success'" app/Http/Controllers` vazio.
- Conferência manual: cadastrar um produto mostra o aviso verde no canto da tela.
