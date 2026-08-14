# DR-001 — Biblioteca de roteamento

**Status:** aberta — precisa de OK do Samuel
**Data:** 2026-08-14
**Bloqueia:** Sprint 1 (layout base). Nada de tela pode começar antes.

## Contexto

A loja tem 4 rotas públicas e hoje não há roteador algum: `App.tsx` renderiza um
`<h1>`. Os filtros do catálogo precisam viver na query string (requisito de link
compartilhável, ver `01-requirements.md`), então o roteador precisa dar acesso
decente a `searchParams`.

O projeto tem 3 dependências de produção (`react`, `react-dom`, `@supabase/supabase-js`)
e bundle atual de 190 kB. Manter isso enxuto é um valor real do repo.

## Opções

**A — `react-router` 8.3.0** (~16 kB gz)
Padrão de fato. `useSearchParams` pronto, data loaders, futuro caminho para SSR.
Custo: é a maior das três e traz conceitos que a loja não usa.

**B — `wouter` 3.10.0** (~2 kB gz)
API mínima e familiar (`<Route>`, `useLocation`). Query string exige um hook próprio
de ~15 linhas. Suficiente para 4 rotas estáticas.

**C — Sem biblioteca**
Uma tela só, com estado interno controlando a seção visível. Zero dependência,
mas mata link compartilhável e o botão "voltar" do navegador — quebra US-2.

## Recomendação

**B (wouter)**, com A como escolha defensável se você quiser o padrão de mercado no
currículo do projeto. A loja tem 4 rotas sem dado aninhado; `react-router` resolveria
um problema que a loja não tem, ao custo de 8× o tamanho.

**C está descartada** — quebra requisito explícito, não é questão de gosto.

## Decisão

_(aguardando)_
