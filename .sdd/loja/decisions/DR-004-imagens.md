# DR-004 — Imagens de produto e a coluna `slot`

**Status:** aberta — precisa de esclarecimento do Samuel
**Data:** 2026-08-14
**Bloqueia:** nada. Sprint 2 e 3 seguem com `img` direto.

## Contexto

Há dois caminhos de imagem no projeto e não está claro qual vale:

1. **`products.img`** — URL absoluta do Wikimedia, populada para os 10 produtos.
   Funciona hoje, sem nenhum código adicional.
2. **`products.slot`** — valores `p1-main`…`p10-main`, mais um `image-slot.js` e um
   `.image-slots.state.json` em `~/recordare-design/` (que contém uma única entrada,
   `rev-2`, com escala e deslocamento). Parece ser um mecanismo de posicionamento
   de imagem do fluxo de design.

As fotos atuais são retratos históricos de domínio público — placeholder óbvio, não
o catálogo real da loja.

## Perguntas

1. `slot` é para trocar as imagens por fotos reais depois, mantendo o enquadramento?
   Ou é resíduo do fluxo de design que pode sair do schema?
2. As fotos do catálogo real existem em algum lugar, ou seguimos com placeholder
   até a loja ter fotos próprias?

## Encaminhamento enquanto não decide

Renderizar `img` direto, com `loading="lazy"` e `alt` vindo do nome do produto no
idioma corrente. Se `slot` virar o caminho oficial, é troca localizada em
`ProductCard` e na galeria de `Produto` — não contamina o resto.

## Decisão

_(aguardando)_
