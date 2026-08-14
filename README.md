# Recordare

Loja de fotoporcelana memorial: medalhões, placas, porcelanatos e acessórios feitos sob encomenda.
Vende em dois canais — o site (pedido registrado no Supabase + atalho de WhatsApp) e o Mercado Livre
(kit de anúncios gerado a partir do mesmo catálogo).

## Stack

| Camada | Escolha                                                     |
| ------ | ----------------------------------------------------------- |
| UI     | React 19 + TypeScript strict + Tailwind v4 (`@theme` tokens) |
| Build  | Vite 8                                                       |
| Rotas  | wouter                                                       |
| Dados  | Supabase (schema `recordare`, RLS default-deny)              |
| Testes | Vitest 4 + Testing Library + jsdom                           |
| Deploy | Vercel (SPA rewrite + CSP/HSTS em `vercel.json`)             |

## Rodando local

```bash
npm ci
cp .env.example .env   # preencher as chaves
npm run dev
```

| Script                | O que faz                                                    |
| --------------------- | ------------------------------------------------------------ |
| `npm run dev`         | servidor de desenvolvimento                                   |
| `npm run typecheck`   | `tsc -b --noEmit`                                             |
| `npm run lint`        | oxlint                                                        |
| `npm run test`        | suíte Vitest                                                  |
| `npm run build`       | typecheck + bundle de produção                                |
| `npm run ml:export`   | gera `out/mercadolivre/anuncios.{csv,md}` do catálogo em prod |
| `npm run seo:sitemap` | regenera `public/sitemap.xml` e `public/robots.txt`           |

## Variáveis de ambiente

Só existem chaves **públicas** no cliente — nada de service-role no bundle.

| Variável                        | Obrigatória | Papel                                                   |
| ------------------------------- | ----------- | ------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | sim         | endpoint do projeto                                     |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | sim         | chave publicável (anon); toda a autorização mora na RLS |
| `VITE_WHATSAPP_PHONE`           | não         | só dígitos, formato internacional                       |

`STORE_ORIGIN` (só nos scripts) define o domínio usado no sitemap e nos anúncios.

## Banco

Migrations em `supabase/migrations/`, aplicadas em ordem no schema `recordare`.

- `products` — leitura pública apenas de `active = true`.
- `orders` / `order_items` — **insert-only** para o público, sem policy de `select`. Por isso o id do
  pedido é gerado no cliente e o recibo da confirmação vive em `sessionStorage`: ninguém lê o pedido
  de outra pessoa pela API.
- O `total` do pedido nunca vem do cliente — um trigger recalcula a partir do preço vigente.

## Fluxo de venda

1. Carrinho em `localStorage`, saneado contra o catálogo vivo (item fora do ar sai e o cliente é avisado).
2. Checkout grava `orders` + `order_items` e leva para `/pedido/:id` com a referência.
3. O link de WhatsApp é **atalho, não pedido**: se o telefone não estiver configurado a loja avisa que
   vai ligar. Nenhuma configuração ausente pode custar uma venda.

## Mercado Livre

`npm run ml:export` valida cada anúncio (título ≤ 60 caracteres, sem palavra promocional, sem emoji,
sem contato externo na descrição) e sai com erro se algo reprovar — o mesmo job roda no CI.

## Segurança

- Nenhum segredo em `VITE_*` além de chaves publicáveis.
- RLS default-deny em todas as tabelas do schema exposto.
- CSP sem `unsafe-inline` em script, HSTS, `nosniff`, `frame-ancestors 'none'` (ver `vercel.json`).
