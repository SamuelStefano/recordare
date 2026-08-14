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
- `orders` — **insert-only** para o público, sem policy de `select`. Por isso o id do pedido é gerado
  no cliente e o recibo da confirmação vive em `sessionStorage`: ninguém lê o pedido de outra pessoa
  pela API. Os itens ficam em `items jsonb` no próprio pedido.
- O `total` do pedido nunca vem do cliente — um trigger recalcula a partir do preço vigente em
  `products`, então mexer no payload não muda o valor gravado. É o total das peças; frete é
  confirmado no atendimento.
- Cada linha de `items` precisa apontar para peça ativa com quantidade inteira de 1 a 99
  (`check_order_items`). Sem isso dava para gravar, falando direto com a API, um pedido de peça
  inexistente ou de 9999 unidades — não vira dinheiro, mas suja a única fila de pedidos que existe.

## Fluxo de venda

1. Carrinho em `localStorage`, saneado contra o catálogo vivo (item fora do ar sai e o cliente é avisado).
2. Checkout grava uma linha em `orders`, com as peças em `items jsonb`, e leva para `/pedido/:id`
   com a referência.
3. O link de WhatsApp é **atalho, não pedido**: se o telefone não estiver configurado a loja avisa que
   vai ligar. Nenhuma configuração ausente pode custar uma venda.
4. Um telefone só consegue registrar 5 pedidos a cada 10 minutos (trigger `throttle_orders`). O
   sexto volta como `PT429` e a loja pede para aguardar em vez de mandar tentar de novo — insistir
   falharia pelos próximos minutos.
5. Se uma peça sair do catálogo entre montar o carrinho e enviar, o banco recusa com `PT422` e a
   loja recarrega o catálogo e pede para revisar a lista. Mandar "tente de novo" jogaria o cliente
   num laço, porque o mesmo carrinho falharia sempre.

### Onde ver os pedidos — leia antes de anunciar

**A loja não avisa ninguém quando um pedido chega.** Não há e-mail, push nem mensagem: o pedido é
gravado em `recordare.orders` e fica lá. Por desenho, a chave publicável **não lê** `orders` — é o
que impede um estranho de ler o pedido alheio —, então não existe painel no site.

Hoje o único jeito de ver é o painel do Supabase: **Table Editor → schema `recordare` → `orders`**,
ordenado por `created_at`. Enquanto não houver notificação, alguém precisa abrir isso todo dia útil,
senão a promessa de "entraremos em contato" fica sem dono.

Caminhos para fechar esse buraco, do mais barato ao mais completo:

| Caminho | O que dá | Custo |
|---|---|---|
| **Preencher `VITE_WHATSAPP_PHONE`** com o número real | Depois de confirmar, o cliente é convidado a mandar o pedido pronto no WhatsApp — o pedido chega no celular sozinho | Uma variável de repositório |
| Database Webhook do Supabase em `orders` → n8n/Zapier → WhatsApp ou e-mail | Aviso na hora, mesmo se o cliente não mandar a mensagem | Configuração no painel, sem código |
| Edge Function no insert mandando e-mail (Resend) | Aviso na hora, sem terceiro | Uma função + uma chave |
| Rotina de conferir o painel | Zero | Depende de disciplina humana |

A primeira linha depende do cliente clicar, então não substitui as outras — mas é o que transforma
"ninguém foi avisado" em "quase sempre alguém foi avisado" ao custo de uma variável. Com o número
preenchido a confirmação mostra um link `wa.me` com a mensagem já escrita:

```
Olá Maria da Silva,

Pedido:
- Medalhão Oval Clássico (1x) [18x24 · Branco · Fosco]

Total: R$ 249,00
Referência: B6C7CC41
```

Número inválido não vira link quebrado: `whatsappLink` exige de 10 a 15 dígitos e, se não bater,
esconde o atalho e a loja promete ligar.

## Mercado Livre

`npm run ml:export` valida cada anúncio (título ≤ 60 caracteres, sem palavra promocional, sem emoji,
sem contato externo na descrição) e sai com erro se algo reprovar — o mesmo job roda no CI.

## Segurança

- Nenhum segredo em `VITE_*` além de chaves publicáveis.
- RLS default-deny em todas as tabelas do schema exposto.
- CSP sem `unsafe-inline` em script, HSTS, `nosniff`, `frame-ancestors 'none'` (ver `vercel.json`).
