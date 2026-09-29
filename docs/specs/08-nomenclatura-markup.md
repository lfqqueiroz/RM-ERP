# Spec 08 — Nomenclatura: markup × margem

## Problema

O modo `margin` calcula `final = base × (1 + m/100)`: isso é **markup sobre o custo**. A tela chama de "Margem de lucro" (`price-calculations/index.tsx:183, 272, 327, 399`). Com 30%, a margem real sobre o preço de venda é 23,08%, o que pode induzir a erro na hora de precificar.

A "Margem resultante" do modo manual (`index.tsx:85-86`, `(manual / base − 1) × 100`) também é markup sobre o custo — consistente com o modo `margin`, mas com o mesmo nome enganoso.

## Mudanças (somente texto/UX — fórmula e dados inalterados)

1. Renomear rótulos para **"Markup sobre o custo (%)"**, com texto de ajuda: "Percentual acrescido ao custo. Ex.: 30% sobre R$ 100 = R$ 130."
2. No resumo do cálculo, exibir as duas métricas lado a lado:
   - Markup: `(final − base) / base`
   - Margem sobre a venda: `(final − base) / final`
3. Modo manual: "Markup resultante" e "Margem resultante" com as mesmas fórmulas acima.
4. Coluna da tabela de cálculos salvos: "Markup".
5. Manter `pricing_mode = 'margin'`, a coluna `profit_margin` e a constante `PRICING_MODE_MARGIN` — renomear exigiria migration. Adicionar comentário na constante explicando que o valor é markup.
6. Mensagens de validação (Spec 07.3): atributo `profit_margin` → "markup".

## Critérios de aceite

- Nenhuma mudança em backend além de comentário/tradução.
- Com base R$ 100 e 30%: tela mostra final R$ 130,00, markup 30% e margem 23,08%.
