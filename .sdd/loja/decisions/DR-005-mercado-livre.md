# DR-005 — Como habilitar a venda no Mercado Livre

**Status:** decidida — kit de anúncios agora, API depois, com gatilho explícito
**Data:** 2026-08-14
**Bloqueia:** nada. Define o que entra nesta entrega e o que fica fora, e por quê.

## Contexto

O pedido foi "sair para começar vendas no Mercado Livre e no site". Existe um segundo
repositório, `~/recordare-mercado-livre` (marca "Franciscana"), com integração completa
de API do ML já escrita: OAuth PKCE, publicação de anúncio, sync de preço e estoque,
webhooks de pedido, cron de renovação de token, painel admin, 107 testes verdes.

E ela nunca rodou. Auditei: as 12 edge functions respondem **404** (nunca foram
deployadas), o schema `franciscana` **não está exposto** no PostgREST (`PGRST106`), e o
projeto Supabase que ela referencia não está sequer na conta que eu administro. O site
responde 200 na Vercel e não consegue listar um produto.

Esse é o dado mais importante desta decisão: **código de integração completo, testado e
plausível, com 0% de operação.** É exatamente o resultado que se obtém ao escrever uma
integração contra uma API que nunca se chamou.

## O que impede a integração de API hoje

Não é código. É credencial e conteúdo:

| Falta | Por quê é bloqueante |
|---|---|
| App no devcenter do ML (`CLIENT_ID`/`CLIENT_SECRET`) | Exige login na sua conta ML. Não tenho e não devo ter. |
| Conta de vendedor com dados fiscais | Anúncio sem isso não publica. |
| `MERCADO_LIVRE_CATEGORY_ID` e atributos obrigatórios | Variam por categoria e são a causa nº 1 de quebra nessas integrações. Só se descobre chamando a API real. |
| **Fotos reais do produto** | O catálogo hoje são retratos de domínio público (ver [[DR-004]]). O ML exige 6+ fotos, a primeira com fundo branco. Nenhum anúncio sobrevive à revisão com foto de terceiro. |

## Opções

**A — Portar a integração de API do `recordare-mercado-livre` agora**
Entrega ~1500 linhas de edge function que não posso exercitar uma única vez contra o
Mercado Livre. Repete literalmente o erro do repo vizinho, agora dentro do bom.

**B — Não fazer nada de ML nesta entrega**
Honesto, mas devolve zero do que foi pedido.

**C — Kit de anúncios gerado do catálogo real, com as regras do ML aplicadas e testadas**
Transforma os 10 produtos em título, descrição, ficha técnica e preço prontos para
colar no publicador do ML. É código testável hoje, contra dado real, e destrava a
venda sem depender de credencial nenhuma.

## Decisão

**C agora. A quando existirem credencial e fotos — e não antes.**

O que entra nesta entrega:

1. **`src/lib/mercadolivre.ts`** — gerador puro e testado que, a partir de um `Product`,
   produz um anúncio dentro das regras reais do ML:
   - título ≤ **60 caracteres**, no formato Produto + Especificação, truncado em
     limite de palavra (nunca no meio de uma palavra);
   - **rejeita termo promocional** (`promoção`, `frete grátis`, `oferta`, `barato`,
     `12x`, `imperdível`…), emoji e URL — os motivos clássicos de anúncio recusado;
   - descrição sem contato externo (telefone, WhatsApp, e-mail e domínio são
     removidos — o ML pune anúncio que tenta tirar o comprador da plataforma);
   - ficha técnica a partir de `sizes`/`colors`/`finishes`/`unit`;
   - `sku` estável por variante, o mesmo que vai para o banco.
2. **`npm run ml:export`** — escreve `out/mercadolivre/anuncios.csv` (uma linha por
   variante) e `out/mercadolivre/anuncios.md` (para conferir com o olho antes de
   publicar). Não vai para o git.
3. **Campos no banco** (migration `0003`): `sku`, `slug`, `stock`, `ml_item_id`,
   `ml_permalink`. `ml_item_id` é o que torna o passo A um `update`, não uma migração:
   quando o anúncio existir, ele tem onde morar, e o site já sabe linkar para ele.
4. **Checklist de ativação** no `README.md`, com o que exatamente precisa ser
   preenchido para ligar a API.

O que **não** entra, deliberadamente: OAuth, publicação por API, sync de estoque e
webhook. Não escrevo integração que não posso exercitar. O código do repo vizinho fica
como referência para o dia em que houver credencial — e ele é bom código, o problema
nunca foi a qualidade dele.

## Consequência para o site

O site não vira intermediário do ML. `ml_permalink` existe para o produto poder exibir
"também disponível no Mercado Livre" quando o anúncio existir — o comprador que confia
mais na plataforma compra lá, e a venda continua sendo sua. Enquanto o campo for nulo,
nada é renderizado.

## O caminho crítico não é meu

Para vender no ML, o gargalo é operacional, não de software: fotografar o catálogo,
criar o app no devcenter, configurar Mercado Envios. O kit está pronto para quando
isso existir.
