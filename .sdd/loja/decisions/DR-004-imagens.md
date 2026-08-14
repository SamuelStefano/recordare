# DR-004 — Imagens de produto e a coluna `slot`

**Status:** decidida — seguir com `img`; `slot` sai da camada de aplicação
**Data:** 2026-08-14
**Bloqueia:** nada.

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

**`products.img` é o caminho oficial. `slot` fica no schema e sai do código.**

`slot` é resíduo do editor de design: o `image-slot.js` e o `.image-slots.state.json`
vivem em `~/recordare-design/`, guardam escala e deslocamento de enquadramento de UMA
imagem (`rev-2`) e nunca foram consumidos por nada dentro da loja. Manter um segundo
caminho de imagem "para o caso de" é como o campo morto vira bug: alguém popula um
lado, lê o outro, e a foto some.

Não dropei a coluna — `drop column` num banco de produção por causa de código não
escrito é destrutivo sem necessidade. Ela fica lá, nullable, sem consumidor, e está
registrada como débito em `04-status.md`.

**O que entrou no lugar, porque isto importa mais que a decisão em si:**

Toda imagem passa por `<ProductImage>`, um componente único que centraliza:

- `loading="lazy"` e `decoding="async"` fora da dobra; a imagem do hero e a primeira
  do catálogo são `eager` com `fetchpriority="high"`, senão o LCP paga o preço.
- `width`/`height` intrínsecos para reservar o espaço. Sem isso o layout pula quando
  a foto chega, e layout que pula em loja parece site quebrado.
- Fundo `bg-sand` enquanto carrega — nunca cinza. O design é bege; placeholder cinza
  denuncia carregamento, placeholder areia parece intencional.
- `alt` traduzido, vindo do nome do produto no idioma corrente.
- `onError` que troca por um placeholder da marca. As URLs são do Wikimedia, um
  domínio de terceiro que pode 404 sem aviso — e vitrine com imagem quebrada custa a
  venda.

**Sobre as fotos.** Continuam sendo retratos históricos de domínio público, ou seja,
placeholder. Isso está no changelog e no README como pendência de conteúdo, não de
código: trocar as 10 URLs é um `update` no banco, não uma alteração de software. A
troca por fotos reais do catálogo é pré-requisito para anunciar no Mercado Livre —
está registrado em [[DR-005]].
