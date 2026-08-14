# Design — Loja Recordare

## 1. Reuse audit (o que JÁ existe — não reescrever)

Levantado em 2026-08-14 lendo `src/` e `supabase/migrations/`.

| Já existe | Onde | Usar como |
|---|---|---|
| Client Supabase com `db.schema: 'recordare'` | `src/lib/supabase.ts` | Import único. Não criar segundo client. |
| `fetchProducts()`, `createOrder()`, tipos `Product`/`CartItem`/`OrderInput` | `src/lib/catalog.ts` | Toda leitura de catálogo passa por aqui. |
| `addItem`, `removeItem`, `setQty`, `cartTotal`, `whatsappMessage` | `src/lib/cart.ts` | Lógica do carrinho **está pronta e testada** (9 testes). Componente só chama. |
| Tokens de cor e fonte | `src/index.css` (`@theme`) | `text-brand`, `bg-sand`, `font-serif`. Zero hex solto. |
| Schema, RLS, trigger de total, 10 produtos semeados | `supabase/migrations/` | Nenhuma migration nova é necessária para as 4 telas. |
| Layout, hierarquia visual, copy | `~/recordare-design/Recordare.dc.html` | Fonte de verdade **visual**. Traduzir para React. |

**Conclusão do audit:** falta só a camada de apresentação. Nenhuma lógica de negócio
nova precisa ser escrita — o que não existe é JSX, roteamento e i18n.

## 2. Rotas

Quatro telas, todas públicas.

| Rota | Tela | Observação |
|---|---|---|
| `/` | Home | hero, destaques, categorias, provas sociais |
| `/catalogo` | Catálogo | filtros na query string, para link compartilhável |
| `/produto/:id` | Produto | `id` é o `text` primary key (`p1`…`p10`) |
| `/carrinho` | Carrinho → pedido | revisão, dados do cliente, envio |

Filtros vivem na URL (`/catalogo?cat=medalhoes&cor=branco`), não em estado local:
o visitante manda o link para a família decidir junto. Isso é do negócio, não capricho.

> Escolha da biblioteca de roteamento: ver `decisions/DR-001-roteamento.md`.

## 3. Idioma (pt/en)

Sem biblioteca de i18n. O volume não justifica:

- Textos de produto **já vêm bilíngues do banco** (`name_pt`/`name_en`, etc.).
  Um helper `pick(product, lang, 'name')` resolve.
- Textos de interface (rótulos de botão, títulos de seção) ficam num dicionário
  `src/lib/i18n.ts` — objeto literal tipado, ~60 chaves.
- Idioma corrente num `LangContext` (React context), com `localStorage` para persistir.

Preço sempre em BRL, formatado com `Intl.NumberFormat('pt-BR')` em ambos os idiomas.

## 4. Estado

| Estado | Onde mora | Por quê |
|---|---|---|
| Produtos | `useProducts()` — fetch uma vez no topo, passado por contexto | São 10 itens; refetch por tela é desperdício. |
| Carrinho | `CartContext` + `localStorage` | Precisa sobreviver à navegação entre telas. Ver `DR-002`. |
| Idioma | `LangContext` + `localStorage` | Escolha do visitante, não deve resetar. |
| Filtros | query string da URL | Compartilhável e volta no botão "voltar". |

Nada de Redux/Zustand: dois contextos e um `useState` por tela resolvem. Estado de
servidor é uma única leitura sem invalidação.

## 5. Arquitetura de componentes

```
src/
  App.tsx                    rotas + providers (Lang, Cart)
  components/
    layout/                  Header, Footer, LangToggle, CartBadge
    ui/                      Button, Badge, Price, Rating, EmptyState, Spinner
    product/                 ProductCard, ProductGrid, FilterBar, AreaCalculator
  hooks/
    useProducts.ts           fetch + loading + erro
    useCart.ts               liga CartContext em src/lib/cart.ts
    useFilters.ts            lê e escreve filtros na query string
  pages/
    Home.tsx  Catalogo.tsx  Produto.tsx  Carrinho.tsx
  lib/                       (já existe) supabase, catalog, cart, i18n
```

Regras herdadas do `MARATONA.md`:

- Um componente por arquivo, PascalCase.
- Arquivo de UI acima de ~150 linhas se quebra.
- Lógica em hook próprio; componente só renderiza JSX.
- Teste ao lado do arquivo (`x.tsx` + `x.test.tsx`).
- Comentário só para WHY não-óbvio.

## 6. Imagens

`products.img` já tem URL absoluta (Wikimedia) e funciona hoje. Existe também uma
coluna `slot` (`p1-main`…) e um `image-slot.js` no repo de design, cuja função ainda
não está clara. Ver `decisions/DR-004-imagens.md` — enquanto não for decidido,
**usar `img` direto**, que é o caminho que já funciona.

## 7. Estratégia de teste

A lógica pura já está coberta. Nas telas, testar comportamento e não marcação:

- `useFilters` — combinação de filtros é E, não OU; limpar filtros restaura tudo.
- `AreaCalculator` — medida em cm vira m² e multiplica o preço corretamente.
- `Carrinho` — falha de `createOrder` mantém o carrinho e não abre o WhatsApp
  (esse é o caso que mais dói se quebrar em produção).
- Validação de nome e telefone espelha o check do banco.

Não testar: cor de pixel, ordem de classe Tailwind, snapshot de árvore inteira.

## 8. Riscos de design

| Risco | Mitigação |
|---|---|
| Traduzir 713 linhas de design vira cópia literal de HTML | Trabalhar tela a tela, começando pelos primitivos em `components/ui`. |
| Calculadora de m² errar preço e o cliente cobrar diferente | Total real vem do trigger no banco; a calculadora é **estimativa visual**. Rotular como tal. |
| Carrinho em `localStorage` guardar produto que saiu do ar | Ao carregar, cruzar com `fetchProducts()` e descartar `id` inexistente ou inativo. |
