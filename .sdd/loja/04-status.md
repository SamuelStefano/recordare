# Status — Loja Recordare

> Atualizar ao fim de cada sprint. Este é o arquivo que atravessa sessões: quem
> abrir o projeto daqui a um mês lê só isto para saber onde parou.

**Última atualização:** 2026-08-14
**Versão atual:** v1.0.0 (loja no ar)
**Sprint corrente:** nenhuma — escopo da rodada entregue
**Gate:** verde (tsc limpo · oxlint silencioso · 89 testes · build em 264 ms · bundle 459 kB / 132 kB gz)
**Produção:** https://samuelstefano.github.io/recordare/

---

## 1. Backlog

### Alta prioridade — fluxo principal

| ID | Item | Sprint | Status |
|---|---|---|---|
| A1 | Schema, RLS, trigger de total, 10 produtos semeados | — | ✅ Concluído |
| A2 | Camada de dados (`fetchProducts`, `createOrder`, tipos) | — | ✅ Concluído |
| A3 | Lógica de carrinho e mensagem de WhatsApp (testada) | — | ✅ Concluído |
| A4 | Roteamento das 5 telas | 1 | ✅ Concluído |
| A5 | Idioma pt/en (contexto + dicionário + `pick`) | 1 | ✅ Concluído |
| A6 | Primitivos de UI e layout (Header, Footer) | 1 | ✅ Concluído |
| A7 | Página Home | 1 | ✅ Concluído |
| A8 | Página Catálogo com filtros na URL | 2 | ✅ Concluído |
| A9 | Página Produto + calculadora de m² | 3 | ✅ Concluído |
| A10 | Carrinho, formulário e envio do pedido | 4 | ✅ Concluído |
| A11 | Kit de anúncios do Mercado Livre validado no CI | — | ✅ Concluído |

### Média prioridade — qualidade

| ID | Item | Sprint | Status |
|---|---|---|---|
| M1 | Responsivo 360 / 768 / 1280 | 5 | ✅ Concluído |
| M2 | Acessibilidade básica (foco, `alt`, contraste, teclado) | 5 | ✅ Concluído |
| M3 | `README.md` real (hoje é o template do Vite) | 5 | ✅ Concluído |
| M4 | Publicação em URL pública | 5 | ✅ Concluído |
| M5 | SEO: canonical, sitemap, JSON-LD, pré-render por rota | 5 | ✅ Concluído |
| M6 | CI (lint/tsc/testes/build) e deploy automático | 5 | ✅ Concluído |

### Fora de escopo desta rodada

Checkout e pagamento · conta de usuário · painel admin · upload de foto pelo site ·
busca textual · SSR/SEO avançado. Justificativa em `01-requirements.md`.

### Débito técnico

| Débito | Impacto | Tratamento |
|---|---|---|
| Fotos de produto são retratos de domínio público servidos pelo Wikimedia | Placeholder óbvio numa loja de memorial, e o host devolve 429 quando o navegador pede as 10 de uma vez — no site as imagens aparecem, mas é dependência de terceiro no caminho da venda. Medido em 14/08: 9 das 10 respondem 200 em sequência e a décima volta 429; espaçadas, todas voltam 200. **No Mercado Livre isso é bloqueante**, porque o anúncio é criado com a foto baixada na hora: um 429 vira anúncio sem imagem | Trocar por foto real de peça, hospedada pela própria loja, antes de subir o kit do ML |
| Coluna `slot` sem consumidor no código | Campo morto no schema | Remover ou usar em uma próxima rodada |
| `rating`/`reviews` são semeados, não reais | Não podem virar `aggregateRating` no JSON-LD sem virar risco de conformidade | Substituir por avaliação real ou remover da tela |
| `@supabase/supabase-js` inteiro no bundle | 132 kB gz para usar só select e insert | Trocar por `fetch` no PostgREST se o peso incomodar |
| GitHub Pages não envia header de resposta | Sem `frame-ancestors` nem HSTS; CSP só pela `<meta>` | `vercel.json` já pronto para migrar quando quiser |

---

## 2. Roadmap

Unidade = **um turno de trabalho**, não uma semana. Projeto pessoal, sem prazo
externo — datar em calendário seria inventar precisão que não existe.

| Sprint | Escopo | Depende de | Estado |
|---|---|---|---|
| — | Fundação: scaffold, schema, dados, carrinho | — | ✅ Concluída |
| 0 | Destravar DR-001 a DR-005 | você | ✅ Concluída |
| 1 | Roteador, i18n, primitivos, layout, Home | DR-001 | ✅ Concluída |
| 2 | Catálogo com filtros na query string | Sprint 1 | ✅ Concluída |
| 3 | Produto, opções, calculadora de m² | Sprint 1 | ✅ Concluída |
| 4 | Carrinho, formulário, `createOrder` + WhatsApp | DR-002, DR-003 | ✅ Concluída |
| 5 | Responsivo, acessibilidade, SEO, CI/CD, publicação | Sprints 1-4 | ✅ Concluída |

**Próxima rodada** (nada bloqueia a venda hoje)

| Item | Por quê |
|---|---|
| `VITE_WHATSAPP_PHONE` com o número real | **É o item mais urgente.** A loja recebe pedido e não avisa ninguém: sem `select` em `orders` não há painel no site, então hoje o pedido só aparece para quem abrir o Supabase. Com o número preenchido, a confirmação convida o cliente a mandar o pedido pronto no WhatsApp e ele chega no celular sozinho. Caminho provado em build local; ver README |
| Notificação que não dependa do cliente clicar | Database Webhook em `orders` ou Edge Function no insert. O atalho de WhatsApp cobre a maioria, não todos |
| Fotos reais das peças | O catálogo vende memória; retrato genérico enfraquece a peça |
| Migrar para Vercel ou domínio próprio | Recupera header de resposta (HSTS, `frame-ancestors`) e tira o subcaminho |

**Riscos abertos**

| Risco | Mitigação |
|---|---|
| Pedido anônimo sem login permite enxurrada de pedido falso | Trigger `throttle_orders`: 5 pedidos por telefone a cada 10 min |
| Calculadora de m² divergir do preço cobrado | Total real vem do trigger; calculadora é estimativa rotulada |
| Carrinho persistido guardar produto que saiu do ar | Saneado contra `fetchProducts()` ao carregar |
| Anúncio reprovado no Mercado Livre por título ou descrição | `ml:export` valida e falha no CI antes de virar anúncio |

---

## 3. Changelog

### v1.0.0 — 14/08/2026 — Loja no ar

**Adicionado**
- Cinco telas: Home, Catálogo, Produto, Carrinho e Pedido, sobre primitivos
  próprios (`Button`, `Chip`, `Badge`, `Price`, `Feedback`, `Layout`)
- Catálogo com filtro de categoria, busca e ordenação **na query string** — a
  URL de um filtro é compartilhável e sobrevive ao recarregar
- Página de produto com escolha de tamanho, cor e acabamento, peças relacionadas
  e calculadora de m² que converte área em caixas
- Carrinho em `localStorage` saneado contra o catálogo vivo, formulário validado
  e `createOrder` levando para `/pedido/:id` com a referência
- Migration `0003`: `sku`, `stock`, `slug` e campos de Mercado Livre
- `npm run ml:export` gera o kit de anúncios em CSV e Markdown, validando título
  (≤ 60 caracteres), ausência de palavra promocional, emoji e contato externo —
  o mesmo job roda no CI e reprova o build
- `npm run seo:sitemap` regenera `sitemap.xml` (12 URLs) e `robots.txt`
- Pré-render por rota no deploy (`scripts/prerender.ts`): cada `/peca/<slug>`
  vira um `index.html` real, com `<head>` correto e JSON-LD de `Product`
- CI (`lint` → `typecheck` → `test` → `build` + validação dos anúncios) e deploy
  automático para GitHub Pages
- `README.md` de verdade: stack, scripts, variáveis, banco, fluxo de venda, e
  onde ver os pedidos que chegam
- Card de compartilhamento próprio (`public/og.png`, 1200×630) para as telas que
  não são de uma peça. A venda circula por WhatsApp e link sem imagem some no
  meio da conversa; a peça continua usando a própria foto

**Corrigido**
- `link_loja` dos anúncios apontava para `recordare.vercel.app`, que não existe,
  e sem barra final — anúncio com link morto ou com redirect. Corrigido o padrão
  nos três scripts e provado: os 10 links respondem 200 em produção
- Rota profunda respondia 404 no GitHub Pages e matava a indexação — resolvido
  pelo pré-render
- `canonical` sem barra final apontava para uma URL que redirecionava, o que o
  Google trata como erro; barra final padronizada em `siteUrl`, pré-render,
  sitemap e `vercel.json`
- A loja abria em inglês conforme o idioma do navegador, conflitando com o
  `<head>` pré-renderizado em português (e quebrando a busca por "medalhão")
- Estado vazio (404, carrinho vazio, peça inexistente) não tinha `h1`; `/peca/`
  com slug inválido herdava o título genérico sem `noindex`
- Botão dizia só "Adicionar", sem dizer do quê
- Suíte dependia do `.env` local e quebrava no CI — `.env.test` com valores
  propositalmente falsos

**Segurança**
- Provado em produção, não presumido: ler `orders` com a chave publicável → 401;
  `PATCH`/`DELETE`/`POST` em `products` → 401; schema `public` → 404
- Adulteração de payload provada inofensiva: pedido com `total: 1.00` e
  `unit_price: 0.5` forjado é **aceito** (201) e gravado com `total = 498.00`, o
  preço vigente do catálogo, e `status = 'novo'`. O banco não discute o número
  que o navegador mandou: ele o ignora
- Migration `0004`: trigger `throttle_orders` limita 5 pedidos por telefone a
  cada 10 minutos. A policy de insert é aberta por necessidade — a loja não tem
  login e o telefone é a única identidade no payload
- Migration `0005`: o freio passou a subir `PT429`, que o PostgREST traduz para
  HTTP 429. Antes ele virava erro genérico e a loja mandava "tente de novo" —
  conselho errado, porque tentar de novo falha pelos próximos 10 minutos. Agora a
  tela distingue freio de falha de rede e pede para aguardar, sem perder o
  carrinho. Provado em produção: 5 pedidos passam, o 6º é barrado com a mensagem
  certa e o carrinho continua guardado
- Migration `0006`: `items` passou a ser validado no banco — cada linha tem que apontar
  para peça ativa com quantidade inteira de 1 a 99, e o que não bate volta `PT422`.
  Falando direto com a API dava para gravar pedido de peça inexistente e de 9999
  unidades; o total já ignorava essas linhas, mas o lixo entrava na única fila de
  pedidos que existe. O trigger se chama `check_order_items` de propósito: o Postgres
  dispara em ordem alfabética e `set_order_total` convertia `qty` para inteiro antes,
  transformando um `qty: "abc"` em erro cru de sintaxe. Provado em produção — item
  inexistente, quantidade 9999, negativa, fracionária, ausente e em texto voltam 422; o
  pedido honesto grava. Do lado da loja o 422 vira "revise o carrinho" com recarga do
  catálogo, em vez de "tente de novo" num carrinho que falharia sempre
- CSP sem `unsafe-inline` em script, via header no `vercel.json` e via `<meta>`
  no `index.html` (única barreira em host sem controle de header)
- `src/security.test.ts` guarda esse CSP: apagar a `<meta>` ou soltar
  `unsafe-inline` não quebraria nenhuma tela, então nada avisaria até alguém
  injetar script. O teste também exige que a meta e o header não divirjam — senão
  o que foi testado no preview não é o que protege em produção — e que o
  `.env.example` não sugira nenhuma variável fora de `VITE_*`/`STORE_ORIGIN`
- Hospedagem documentada no README: o GitHub Pages não serve header, então
  `frame-ancestors` e HSTS **não existem em produção hoje** (meta não suporta
  nenhum dos dois) e `/pedido/:id` responde 404 embora mostre o recibo. O
  `vercel.json` já resolve os dois; falta apontar um domínio
- Nenhum `dangerouslySetInnerHTML`, `innerHTML` ou `eval`; todo `target="_blank"`
  com `noopener`
- Linhas de teste e sondagem apagadas: `recordare.orders` voltou a zero

**Acessibilidade e responsivo** — auditado no navegador, em Chromium e Firefox
- Exatamente um `h1` por página · `lang="pt-BR"` · 0 imagem sem `alt` · 0 botão
  sem nome acessível · 0 input sem rótulo · primeiro Tab cai em "Pular para o
  conteúdo" · 0 px de overflow horizontal em 320, 360, 768 e 1280 (320 px é o
  piso da WCAG 1.4.10, equivalente a 1280 px com zoom de 400%)
- Jornada inteira percorrida só com teclado em produção: chegar na peça, escolher
  variante, adicionar (o leitor de tela ouve "Adicionado ✓"), preencher o
  formulário e ser barrado por telefone curto. `Esc` fecha o menu do celular e
  devolve o foco ao botão que o abriu
- Todo alvo de toque com no mínimo 24 px (WCAG 2.2, 2.5.8): os links do rodapé e
  o "Ver tudo" passavam só pela exceção de espaçamento, o que é apertado demais
  para o público desta loja
- **axe-core (WCAG 2.1 AA): 0 violação** nas quatro telas e em 360 px. Chegou lá
  corrigindo três tokens que reprovavam no contraste mínimo: `brand` (4,22:1),
  `faint` (2,91:1) e `night-dim` no rodapé escuro (3,26:1). Os novos valores são
  os tons mais claros que alcançam 4,5:1, então a identidade da marca e a
  hierarquia entre `muted` e `faint` continuam de pé

### v0.1.0 — 13/08/2026 — Fundação

**Adicionado**
- Scaffold Vite 8 + React 19 + TypeScript + Tailwind v4, com Vitest e Oxlint
  configurados (`chore: scaffold vite+react+ts+tailwind`)
- Tokens de cor e tipografia da marca em `src/index.css` via `@theme`
- Schema `recordare` com `products` e `orders`, checks de integridade e índice
  por data (`feat: schema supabase e camada de dados`)
- RLS habilitada: catálogo com leitura pública apenas de item ativo; `orders`
  aceita insert anônimo e **não** expõe select
- Trigger `set_order_total`, que recalcula o total a partir do preço vigente e
  ignora o que vier do navegador
- Seed com 10 produtos bilíngues nas quatro categorias
- Camada de dados: `fetchProducts()`, `createOrder()` e os tipos `Product`,
  `CartItem`, `OrderInput`
- Client Supabase apontando para o schema `recordare` (sem isso o PostgREST
  responde 404 em toda tabela)
- Lógica de carrinho — `addItem`, `removeItem`, `setQty`, `cartTotal` — e
  `whatsappMessage()`, com 9 testes (`feat: logica do carrinho e mensagem de whatsapp`)
- `MARATONA.md` com o briefing de turno e o gate de entrega

**Segurança**
- Total do pedido nunca sai do cliente: `createOrder` omite o campo e o banco
  recalcula. `orders` aceita insert anônimo, então um total vindo do navegador
  seria um número escolhido por quem quisesse.

**Ainda não existia nesta versão**
- Nenhuma tela. `App.tsx` renderizava um `<h1>` com o nome da loja.

---

## 4. Como retomar

1. Ler este arquivo e `decisions/` — o escopo da rodada está fechado, o que
   sobrou está em **Próxima rodada** e em **Débito técnico**.
2. Rodar o gate: `npm run lint && npm run typecheck && npm run test && npm run build`.
3. Mexer no banco só por migration nova em `supabase/migrations/`, numerada em
   sequência — o que está lá já foi aplicado em produção.
4. Ao terminar: atualizar o backlog e o changelog **aqui**, e só então considerar
   a entrega feita.
