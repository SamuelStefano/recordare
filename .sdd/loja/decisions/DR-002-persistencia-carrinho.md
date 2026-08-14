# DR-002 — Persistência do carrinho

**Status:** decidida — A (`localStorage`)
**Data:** 2026-08-14
**Bloqueia:** nada.

## Contexto

`src/lib/cart.ts` opera sobre um array puro de `CartItem` e não sabe onde ele mora.
Falta decidir se o carrinho sobrevive ao recarregar a página.

Peculiaridade do negócio: fotoporcelana é compra deliberada e consultada em família.
É plausível a pessoa montar o carrinho, fechar o navegador e voltar no dia seguinte —
mais plausível do que em e-commerce comum.

## Opções

**A — `localStorage`**
Carrinho sobrevive a fechar o navegador. Exige limpar itens cujo `id` sumiu ou ficou
inativo no catálogo (senão o carrinho mostra peça que não está mais à venda).

**B — `sessionStorage`**
Sobrevive ao recarregar, morre ao fechar a aba. Menos código de invalidação.

**C — Só em memória**
Recarregou, perdeu. Mais simples de todas; irritante para o visitante.

## Recomendação

**A (`localStorage`)**, com a regra de saneamento já prevista no `02-design.md`:
ao carregar, cruzar o carrinho com `fetchProducts()` e descartar silenciosamente
`id` inexistente ou inativo.

O custo é ~10 linhas e cobre o comportamento real de quem compra memorial.

## Decisão

**A — `localStorage`**, chave `recordare.cart.v1`, com saneamento na carga.

O comportamento real de quem compra memorial decide isto: a peça é escolhida em
família, ao longo de dias. Perder o carrinho ao fechar o navegador é perder a venda.

Regras implementadas em `src/cart/CartContext.tsx`:

- Chave versionada (`.v1`). Se o formato mudar, muda a chave e o carrinho velho é
  ignorado, em vez de explodir num `JSON.parse` de formato antigo.
- Toda leitura passa por `sanitizeCart(raw, products)`: descarta o que não for array,
  item sem `id` string, `qty` que não seja inteiro ≥ 1, e `id` que não exista mais ou
  esteja inativo. Descarte é silencioso — o visitante não tem o que fazer com a
  informação de que um produto saiu do ar.
- `qty` tem teto de 99 por linha. Sem teto, um `localStorage` editado à mão vira
  pedido de dez milhões de unidades. O total real vem do trigger, mas a tela não
  precisa exibir esse absurdo, e o check `jsonb_array_length between 1 and 50` do
  banco limita o número de linhas, não a quantidade dentro da linha.
- Escrita em `try/catch`: com storage bloqueado o carrinho degrada para memória em
  vez de derrubar a tela.

**Nada sensível vai para o `localStorage`** — só `id`, `qty` e as opções escolhidas.
Nome e telefone ficam em memória, no formulário, até o `createOrder`.
