# Spec 14 — Editar pedido sem alterar preços já gravados

## Problema

`SaleController::saveSale` trata a edição apagando todos os itens e recriando-os a partir do formulário (`$sale->items()->delete()` + `create`), sempre com o preço **atual** do cálculo (`SaleController.php:105-113`). Consequências:

1. **Repreço silencioso.** Se um cálculo de preço foi editado depois do pedido (o `final_price` muda e o id continua o mesmo), salvar o pedido — mesmo alterando só o telefone do cliente — troca o `unit_price` e o `total_amount` de itens que ninguém tocou. O histórico do pedido muda sem aviso.
2. **Pedidos antigos travados.** Item cujo produto ou cálculo foi excluído chega à tela com `product_id`/`price_calculation_id` vazios (as FKs são `nullOnDelete`). A validação exige os dois, então o pedido não pode mais ser salvo sem trocar o item.
3. Os itens perdem o `id` a cada edição (apagados e recriados).

O snapshot (`product_name`, `product_sku`, `unit_price`) existe justamente para preservar o pedido como foi feito — a edição não deveria descartá-lo.

## Regra proposta

Cada item enviado na edição pode trazer o `id` de um item existente do pedido:

| Situação do item | Comportamento |
|---|---|
| Com `id` e `price_calculation_id` vazio | **Mantém** produto, nome, SKU e `unit_price` gravados; só a quantidade pode mudar (`total = unit_price × quantidade`). Vale também para produto/cálculo excluídos. |
| Com `id` e `price_calculation_id` preenchido | Repreça com o cálculo escolhido (que deve pertencer ao produto), como hoje. |
| Sem `id` (item novo) | Como hoje: produto + preço salvo obrigatórios. |
| Item existente não enviado | Removido do pedido. |

Ou seja: **manter o preço é o padrão**; repreçar é uma escolha explícita.

## Mudanças

### Backend
1. `SaleStoreRequest` (ou um `SaleUpdateRequest` próprio):
   - `items.*.id`: `nullable|integer`, e no `after()` verificar que pertence ao pedido da rota.
   - `items.*.product_id` e `items.*.price_calculation_id`: obrigatórios só para itens novos (`required_without:items.*.id`); para item existente sem preço, `product_id` deve ser vazio ou igual ao gravado (não dá para trocar o produto sem escolher um preço).
   - Produto repetido no mesmo pedido: erro de validação (`distinct`, ignorando vazios), em vez da junção silenciosa de linhas que `saveSale` faz hoje — o frontend já impede repetir produto.
2. `SaleController::update`: atualizar itens existentes por `id`, criar os novos e excluir os ausentes, dentro de `DB::transaction`; recalcular `sales.total_amount` em centavos (`Money`).
3. `SaleController::store` continua igual (pedido novo sempre usa o preço atual).

### Frontend (`components/sales/sale-edit-dialog.tsx` + `OrderItemsEditor`)
- Enviar o `id` dos itens existentes.
- Itens existentes abrem com o preço em "**Preço do pedido: R$ X**" (opção vazia do select = manter); as demais opções são os preços salvos atuais do produto, para repreçar se quiser.
- Item com produto excluído: nome do snapshot em texto (ex.: "Vaso (VAS-001) — produto excluído"), produto não editável, quantidade editável, botão de remover.

## Fora do escopo

Status de pedido (cancelado/entregue) e exclusão de pedidos.

## Critérios de aceite

- Teste: cálculo editado depois do pedido; editar só o telefone → `unit_price` e `total_amount` dos itens **não mudam**.
- Teste: mudar só a quantidade de um item → `total = unit_price gravado × nova quantidade`.
- Teste: escolher explicitamente um preço salvo num item existente → repreça.
- Teste: pedido com produto excluído e com cálculo excluído → salvar edição funciona e mantém o snapshot.
- Teste: `id` de item de **outro** pedido → erro de validação.
- Teste: produto repetido → erro de validação.
- Teste: os ids dos itens mantidos não mudam.
- Regra "pedido ≠ baixa de estoque" preservada (estoque inalterado em todos os testes).
