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
| Deploy | GitHub Pages (`vercel.json` pronto para migrar, ver Hospedagem) |

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
| `npm run feeds`       | gera `dist/feeds/google.xml` e `dist/feeds/meta.csv` (roda no deploy) |

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

> **Pendente de aprovação: `0007_orders_insert_columns.sql`.** O grant de insert em `orders` é da
> tabela inteira, então um pedido enviado direto na API pode escolher `status` e `created_at` —
> nasce fora da primeira página do Table Editor, que é o único lugar onde alguém vê pedido novo.
> A migration troca pelo grant das cinco colunas que o site realmente escreve. **Não foi aplicada.**

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
| **Edge Function `order-notify`** (já escrita, ver [Integrações](#integrações)) | Aviso na hora no Telegram, no e-mail ou num webhook (n8n/Zapier), mesmo se o cliente não mandar a mensagem | Deploy da função + um segredo + um Database Webhook no painel |
| Rotina de conferir o painel | Zero | Depende de disciplina humana |

A primeira linha depende do cliente clicar, então não substitui as outras — mas é o que transforma
"ninguém foi avisado" em "quase sempre alguém foi avisado" ao custo de uma variável. Com o número
preenchido a confirmação mostra um link `wa.me` com a mensagem já escrita:

```
Olá Maria da Silva,

Pedido:
- Medalhão Oval Clássico (1x) [18x24 · Branco · Fosco]

Subtotal: R$ 249,00
Frete: R$ 39,90
Total: R$ 288,90
Referência: B6C7CC41
```

O resumo repete linha por linha o que estava na tela do carrinho. Mandar só o total das peças
faria a primeira mensagem do atendimento contradizer a loja em R$ 39,90.

Número inválido não vira link quebrado: `whatsappLink` exige de 10 a 15 dígitos e, se não bater,
esconde o atalho e a loja promete ligar.

## Mercado Livre

`npm run ml:export` valida cada anúncio (título ≤ 60 caracteres, sem palavra promocional, sem emoji,
sem contato externo na descrição) e sai com erro se algo reprovar — o mesmo job roda no CI.

> **Falta antes de anunciar: foto real das peças.** O catálogo foi semeado com imagens de banco
> público (Wikimedia) e o export marca cada uma com `NÃO PUBLIQUE`. Não é limitação técnica: o
> Mercado Livre baixa a foto ao criar o anúncio, então subir assim publica a peça com o retrato de
> outra pessoa. Isso reprova por direito de imagem e derruba a reputação do vendedor. Trocar
> `products.img` pela foto real (de preferência servida pela própria loja) apaga o aviso sozinho.
>
> Foto em host novo exige mexer no `img-src` do CSP (`index.html` **e** `vercel.json`, que o teste
> compara): fora da lista, a imagem simplesmente não carrega na loja.

O kit também avisa quando a peça já tem `ml_item_id` — republicar cria anúncio duplicado, e
duplicata derruba a reputação do vendedor. A planilha leva a coluna `ml_item_id` para essa
conferência.

## Integrações

Três pontos de encaixe, todos desligados até alguém configurar — nenhum muda o comportamento da
loja sozinho.

### Aviso de pedido novo — `supabase/functions/order-notify`

Um **Database Webhook** no `INSERT` de `recordare.orders` chama a função, que monta o resumo (peças,
variante, total das peças, link `wa.me` do cliente) e manda para cada canal que tiver segredo:

| Segredo | Canal |
|---|---|
| `ORDER_NOTIFY_SECRET` | **obrigatório** — o webhook manda no header `x-webhook-secret`; sem ele a função responde 401 |
| `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` | mensagem no celular, grátis (bot criado no @BotFather) |
| `RESEND_API_KEY` + `ORDER_NOTIFY_EMAIL_TO` (+ `ORDER_NOTIFY_EMAIL_FROM`) | e-mail; vários destinatários separados por vírgula |
| `ORDER_NOTIFY_WEBHOOK_URL` | `POST` JSON `{ "event": "order.created", "order": {...} }` para n8n, Zapier, Make, planilha ou CRM |

```bash
npx supabase@latest functions deploy order-notify --project-ref qvoytjrfuyeammxsuwtx --no-verify-jwt
npx supabase@latest secrets set --project-ref qvoytjrfuyeammxsuwtx \
  ORDER_NOTIFY_SECRET="$(openssl rand -hex 32)" TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=...
```

Depois, no painel: **Database → Webhooks → Create** · tabela `recordare.orders` · evento `Insert` ·
tipo *Supabase Edge Functions* → `order-notify` · header `x-webhook-secret` com o mesmo valor.

- `--no-verify-jwt` porque quem chama é o banco, não um usuário; a porta é o segredo, comparado em
  tempo constante.
- A função lê o nome das peças com a **chave anônima** (só catálogo ativo) — não usa service_role.
- Nome e observação vêm de formulário anônimo e passam por escape antes de virar HTML no e-mail.
- Falha de um canal não derruba os outros e não afeta o pedido, que já está gravado; o motivo fica
  no log da função.

### Medição — `window.dataLayer`

A jornada publica eventos no formato de e-commerce do GA4 (`src/lib/analytics.ts`): `view_item_list`,
`view_item`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `generate_lead` (pedido
registrado, com `transaction_id` = referência) e `contact` (clique no WhatsApp). Os mesmos eventos saem
como `CustomEvent('recordare:track')` no `window`.

- Pedido é `generate_lead`, não `purchase`: ainda não foi pago nem teve frete confirmado.
- `item_id` é o SKU, o mesmo do Mercado Livre e dos feeds.
- **Nome e telefone do cliente nunca entram no dataLayer** — o teste do checkout garante.

Nenhum script de terceiro é carregado. Para ligar o Google Tag Manager (e por ele GA4, Meta Pixel,
Clarity), é preciso **liberar o host no CSP** — `script-src`/`connect-src`/`img-src` no `index.html`
**e** no `vercel.json`, que o `security.test.ts` compara — e incluir o snippet do GTM como arquivo
próprio (o CSP recusa script inline). É decisão de segurança e de LGPD (banner de consentimento), por
isso não vem ligado.

### Feeds de catálogo — `dist/feeds/`

O deploy gera, a partir do catálogo vivo:

| Arquivo | Onde cadastrar |
|---|---|
| `https://samuelstefano.github.io/recordare/feeds/google.xml` | Google Merchant Center → Produtos → Feeds → *Busca programada* (vitrine grátis do Google e Shopping) |
| `https://samuelstefano.github.io/recordare/feeds/meta.csv` | Meta Commerce Manager → Catálogo → Fontes de dados → *Feed programado* (Instagram, Facebook, catálogo do WhatsApp) |

Preço e estoque chegam aos dois canais no deploy seguinte. **Hoje os feeds saem vazios**, de propósito:
peça com foto de banco de imagem fica de fora (mesmo motivo do `NÃO PUBLIQUE` do Mercado Livre) e o
deploy lista quais. Com a foto real no lugar, a peça entra sozinha.

## Hospedagem

Produção hoje é **GitHub Pages** (`https://samuelstefano.github.io/recordare/`), publicada pelo
workflow `deploy.yml`. O Pages não deixa configurar header de resposta nem reescrita de rota, e isso
tem duas consequências:

- O CSP viaja numa `<meta http-equiv>` no `index.html`. Meta não aceita `frame-ancestors` nem HSTS,
  então essas duas proteções **não existem no Pages** — `X-Frame-Options` também é header. As rotas
  são pré-renderizadas para que cada uma carregue a meta e o `<title>` certos.
- Sem reescrita, `/pedido/:id` cai no `404.html`: o recibo aparece normalmente depois da hidratação,
  mas o **status HTTP é 404**. Não atrapalha o cliente e mantém a rota fora do índice, embora suje
  qualquer monitoração que olhe só o código.

`vercel.json` já traz rewrite de SPA e os headers completos (CSP com `frame-ancestors 'none'`, HSTS,
`nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP). Apontar um domínio para a Vercel resolve
os dois pontos acima sem mexer no código.

## Segurança

- Nenhum segredo em `VITE_*` além de chaves publicáveis.
- RLS default-deny em todas as tabelas do schema exposto.
- CSP sem `unsafe-inline` em script, HSTS, `nosniff`, `frame-ancestors 'none'` (ver `vercel.json`).
