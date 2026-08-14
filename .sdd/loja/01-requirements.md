# Requisitos — Loja Recordare

## Contexto

Fotoporcelana é compra de luto: o visitante chega fragilizado, comparando poucas
opções, e quase nunca fecha sozinho no site. Por isso a loja **não tem checkout**.
O objetivo do site é levar a pessoa até uma conversa no WhatsApp com o pedido já
montado — não processar pagamento.

## User stories

**US-1 — Entender o que a loja vende**
Como visitante que acabou de perder alguém, quero entender em segundos o que é
fotoporcelana e que a peça dura, para confiar antes de olhar preço.

**US-2 — Encontrar a peça certa**
Como comprador, quero filtrar o catálogo por categoria, cor, tamanho e acabamento,
para chegar rápido no que serve na lápide que já existe.

**US-3 — Conferir a peça em detalhe**
Como comprador, quero ver a peça ampliada, escolher tamanho/cor/acabamento e
entender o preço, para não errar a encomenda.

**US-4 — Calcular área**
Como comprador de porcelanato, quero informar as medidas e ver o preço da área,
porque o produto é vendido por m² e eu não sei calcular de cabeça.

**US-5 — Fechar pelo WhatsApp**
Como comprador, quero revisar o carrinho, deixar meu nome e telefone e cair no
WhatsApp com o pedido escrito, para falar com um humano sem repetir tudo.

**US-6 — Ler em inglês**
Como visitante estrangeiro, quero alternar o site para inglês, porque encomendo
uma peça para um familiar no Brasil.

## Critérios de aceitação (EARS)

### Catálogo
- `WHEN` a Home carrega, `the system SHALL` exibir os produtos em destaque vindos
  de `fetchProducts()`, sem valores escritos no código.
- `WHEN` o visitante seleciona uma categoria, `the system SHALL` exibir apenas
  produtos daquela `cat`.
- `WHEN` o visitante combina filtros de cor, tamanho e acabamento, `the system SHALL`
  aplicar todos simultaneamente (E, não OU).
- `IF` nenhum produto atende aos filtros, `THEN the system SHALL` exibir estado
  vazio explicando como limpar os filtros — nunca uma grade em branco.
- `WHILE` `fetchProducts()` não resolveu, `the system SHALL` exibir estado de
  carregamento.
- `IF` `fetchProducts()` falhar, `THEN the system SHALL` exibir mensagem de erro com
  ação de tentar de novo.

### Produto
- `WHEN` o visitante abre um produto, `the system SHALL` exibir galeria, descrição,
  avaliação e as opções de `sizes`, `colors` e `finishes` daquele produto.
- `IF` o produto tem `unit = 'm2'`, `THEN the system SHALL` exibir calculadora de
  área e apresentar o preço como preço por m².
- `WHEN` o visitante adiciona ao carrinho sem escolher tamanho, cor ou acabamento
  disponíveis, `the system SHALL` bloquear a ação e sinalizar o que falta.

### Carrinho e pedido
- `WHEN` o visitante adiciona a mesma peça com as mesmas opções, `the system SHALL`
  somar a quantidade em vez de criar uma segunda linha (já implementado em `addItem`).
- `WHEN` a quantidade chega a zero, `the system SHALL` remover a linha do carrinho.
- `WHEN` o visitante envia o pedido, `the system SHALL` chamar `createOrder()` **sem**
  o campo `total` e, só depois do sucesso, abrir o WhatsApp.
- `IF` `createOrder()` falhar, `THEN the system SHALL` manter o carrinho intacto,
  mostrar o erro e **não** abrir o WhatsApp.
- `WHEN` o nome tiver menos de 2 caracteres ou o telefone não casar com
  `^[0-9+() -]{8,20}$`, `the system SHALL` bloquear o envio no cliente — o mesmo
  check que o banco já faz.

### Idioma
- `WHEN` o visitante troca o idioma, `the system SHALL` trocar os textos da interface
  e os campos `name_*` / `desc_*` / `badge_*` dos produtos.
- `WHILE` o idioma é `en`, `the system SHALL` manter os preços em BRL — a loja vende
  no Brasil.

### Transversal
- `WHEN` qualquer tela renderiza em viewport de 360px, `the system SHALL` permanecer
  legível e utilizável sem rolagem horizontal.
- `the system SHALL` usar exclusivamente os tokens de `@theme` em `src/index.css`
  para cor e tipografia.

## Fora de escopo

Explicitamente **não** entram nesta rodada:

- Checkout, pagamento, frete ou cálculo de entrega.
- Conta de usuário, login, histórico de pedidos.
- Painel administrativo — produto se cadastra por migration/seed.
- Upload de foto do falecido pelo site (a foto vai pelo WhatsApp).
- Busca textual no catálogo (filtros já resolvem 10 produtos).
- SSR, SEO avançado, blog.

## Restrições herdadas

- **Nunca** enviar `total` em `createOrder` — trigger `set_order_total` recalcula do
  preço vigente. Total do navegador é número escolhido por quem quiser.
- **Nenhum segredo novo** em `VITE_*`. O que está no bundle é público.
- `orders` aceita insert anônimo e não tem policy de `select`: o site insere e nunca lê
  pedido. Não tentar listar pedidos no front.
