# DR-002 — Persistência do carrinho

**Status:** aberta — precisa de OK do Samuel
**Data:** 2026-08-14
**Bloqueia:** Sprint 4 (carrinho). Não bloqueia as telas anteriores.

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

_(aguardando)_
