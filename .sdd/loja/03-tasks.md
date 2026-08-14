# Tasks — Loja Recordare

Unidade de sprint = **um turno de trabalho**, não uma semana. O `MARATONA.md` já
estabelece "um turno por tela" e a razão continua válida: um turno que faz quatro
telas colapsa quatro medições numa só, e revisar isso depois é pior que fazer.

Toda sprint termina com os três verdes:
`npx tsc -b --noEmit && npx vitest run && npx vite build`

---

## Sprint 0 — Destravar decisões  ⬅ **você está aqui**

| # | Task | Pronto quando |
|---|---|---|
| 0.1 | Decidir DR-001 (roteador) | `decisions/DR-001` com decisão preenchida |
| 0.2 | Decidir DR-002 (persistência do carrinho) | idem |
| 0.3 | Informar DR-003 (número do WhatsApp) | `VITE_WHATSAPP_PHONE` no `.env.example` |
| 0.4 | Esclarecer DR-004 (imagens / `slot`) | idem, ou marcada como "seguir com `img`" |

DR-001 bloqueia tudo. DR-003 só bloqueia a Sprint 4. DR-004 não bloqueia nada.

---

## Sprint 1 — Fundação de UI + Home

| # | Task | Pronto quando |
|---|---|---|
| 1.1 | Instalar e configurar o roteador escolhido; 4 rotas respondendo | `/`, `/catalogo`, `/produto/:id`, `/carrinho` renderizam placeholder distinto |
| 1.2 | `LangContext` + `src/lib/i18n.ts` + helper `pick(product, lang, campo)` | alternar idioma troca texto de interface e de produto |
| 1.3 | Primitivos em `components/ui`: `Button`, `Badge`, `Price`, `Rating`, `EmptyState`, `Spinner` | cada um usa só token de `@theme`; `Price` formata BRL |
| 1.4 | `components/layout`: `Header` (navegação + `LangToggle` + `CartBadge`) e `Footer` | header fixo funciona em 360px sem rolagem horizontal |
| 1.5 | `useProducts()` — fetch, loading, erro, retry | erro de rede exibe mensagem com ação de tentar de novo |
| 1.6 | Página **Home**: hero, destaques, categorias, provas sociais | destaques vêm de `fetchProducts()`, zero produto escrito no código |

**Aceite da sprint:** abrir `/` mostra a Home traduzida do design, em pt e en, com
dados reais do Supabase.

---

## Sprint 2 — Catálogo

| # | Task | Pronto quando |
|---|---|---|
| 2.1 | `useFilters()` — lê e escreve `cat`, `cor`, `tamanho`, `acabamento` na query string | recarregar a página preserva os filtros |
| 2.2 | `FilterBar` — controles dos quatro filtros + limpar | opções derivadas dos produtos, não escritas no código |
| 2.3 | `ProductCard` e `ProductGrid` | card leva a `/produto/:id`; imagem com `loading="lazy"` e `alt` traduzido |
| 2.4 | Ordenação (preço, avaliação) | ordenação também vive na query string |
| 2.5 | Estados de vazio, carregando e erro | vazio explica como limpar filtros |
| 2.6 | Teste: filtros combinam com E; limpar restaura tudo | `useFilters.test.ts` verde |

**Aceite da sprint:** `/catalogo?cat=medalhoes&cor=branco` abre já filtrado e o link
funciona em aba anônima.

---

## Sprint 3 — Produto

| # | Task | Pronto quando |
|---|---|---|
| 3.1 | Página **Produto**: galeria, descrição, avaliação, badge | `id` inexistente cai em estado "não encontrado", não em tela branca |
| 3.2 | Seleção de tamanho, cor e acabamento | adicionar sem escolher opção disponível fica bloqueado, com o que falta sinalizado |
| 3.3 | `AreaCalculator` para `unit = 'm2'` | entra medida em cm, sai m² e estimativa de preço, **rotulada como estimativa** |
| 3.4 | Adicionar ao carrinho via `addItem` de `src/lib/cart.ts` | mesma peça com mesmas opções soma quantidade, não duplica linha |
| 3.5 | Teste: cálculo de área e bloqueio de opção faltante | verde |

**Aceite da sprint:** dá para escolher um porcelanato, calcular 2,5 m² e adicionar ao
carrinho com as opções corretas.

---

## Sprint 4 — Carrinho → pedido

| # | Task | Pronto quando |
|---|---|---|
| 4.1 | `CartContext` com persistência (conforme DR-002) e saneamento contra `fetchProducts()` | item de produto inativo some sem quebrar a tela |
| 4.2 | Página **Carrinho**: linhas, quantidade, remover, total | quantidade zero remove a linha |
| 4.3 | Formulário do cliente com validação espelhando o banco | nome < 2 caracteres ou telefone fora de `^[0-9+() -]{8,20}$` bloqueia o envio |
| 4.4 | Envio: `createOrder()` **sem** `total`, e só depois abrir `wa.me` | falha mantém carrinho, mostra erro e **não** abre o WhatsApp |
| 4.5 | Teste do caminho de falha do 4.4 | verde — é o caso que mais dói em produção |

**Aceite da sprint:** pedido real entra em `recordare.orders` com `total` calculado
pelo trigger, e o WhatsApp abre com o resumo.

---

## Sprint 5 — Acabamento e publicação

| # | Task | Pronto quando |
|---|---|---|
| 5.1 | Passada de responsivo em 360px / 768px / 1280px | nenhuma rolagem horizontal |
| 5.2 | Acessibilidade básica: foco visível, `alt`, contraste, navegação por teclado | percorrer a compra inteira sem mouse |
| 5.3 | Revisar bundle e imagens | build sem aviso de tamanho |
| 5.4 | `README.md` do projeto (hoje é o template do Vite) | descreve a loja, o setup e as variáveis |
| 5.5 | Publicar (Vercel, como o `recordare-mercado-livre`) | URL pública abrindo com dados reais |

**Aceite da sprint:** loja no ar, percorrível do hero até o WhatsApp.
