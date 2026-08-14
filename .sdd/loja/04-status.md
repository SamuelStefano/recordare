# Status — Loja Recordare

> Atualizar ao fim de cada sprint. Este é o arquivo que atravessa sessões: quem
> abrir o projeto daqui a um mês lê só isto para saber onde parou.

**Última atualização:** 2026-08-14
**Versão atual:** v0.1.0 (fundação)
**Sprint corrente:** Sprint 0 — destravar decisões
**Gate:** verde (tsc limpo · 9 testes · build em 199 ms · bundle 190 kB / 60 kB gz)

---

## 1. Backlog

### Alta prioridade — fluxo principal

| ID | Item | Sprint | Status |
|---|---|---|---|
| A1 | Schema, RLS, trigger de total, 10 produtos semeados | — | ✅ Concluído |
| A2 | Camada de dados (`fetchProducts`, `createOrder`, tipos) | — | ✅ Concluído |
| A3 | Lógica de carrinho e mensagem de WhatsApp (testada) | — | ✅ Concluído |
| A4 | Roteamento das 4 telas | 1 | ⛔ Bloqueado por DR-001 |
| A5 | Idioma pt/en (contexto + dicionário + `pick`) | 1 | ⬜ A fazer |
| A6 | Primitivos de UI e layout (Header, Footer) | 1 | ⬜ A fazer |
| A7 | Página Home | 1 | ⬜ A fazer |
| A8 | Página Catálogo com filtros na URL | 2 | ⬜ A fazer |
| A9 | Página Produto + calculadora de m² | 3 | ⬜ A fazer |
| A10 | Carrinho, formulário e envio do pedido | 4 | ⛔ Bloqueado por DR-003 |

### Média prioridade — qualidade

| ID | Item | Sprint | Status |
|---|---|---|---|
| M1 | Responsivo 360 / 768 / 1280 | 5 | ⬜ A fazer |
| M2 | Acessibilidade básica (foco, `alt`, contraste, teclado) | 5 | ⬜ A fazer |
| M3 | `README.md` real (hoje é o template do Vite) | 5 | ⬜ A fazer |
| M4 | Publicação em URL pública | 5 | ⬜ A fazer |

### Fora de escopo desta rodada

Checkout e pagamento · conta de usuário · painel admin · upload de foto pelo site ·
busca textual · SSR/SEO avançado. Justificativa em `01-requirements.md`.

### Débito técnico

| Débito | Impacto | Tratamento |
|---|---|---|
| `README.md` é o template do Vite | Quem clona não sabe o que é o projeto | Sprint 5 (M3) |
| `whatsappMessage()` é fixo em português | Loja em inglês manda pedido em português | Decidir em DR-003 |
| Fotos de produto são retratos de domínio público | Placeholder óbvio numa loja de memorial | Depende de DR-004 |
| Coluna `slot` sem consumidor no código | Campo morto no schema até se decidir | DR-004 |
| `App.test.tsx` testa o placeholder | Vira falso positivo quando a Home existir | Sprint 1 (1.6) |

---

## 2. Roadmap

Unidade = **um turno de trabalho**, não uma semana. Projeto pessoal, sem prazo
externo — datar em calendário seria inventar precisão que não existe.

| Sprint | Escopo | Depende de | Estado |
|---|---|---|---|
| — | Fundação: scaffold, schema, dados, carrinho | — | ✅ Concluída |
| **0** | **Destravar DR-001 a DR-004** | **você** | 🔵 **Corrente** |
| 1 | Roteador, i18n, primitivos, layout, Home | DR-001 | ⬜ |
| 2 | Catálogo com filtros na query string | Sprint 1 | ⬜ |
| 3 | Produto, opções, calculadora de m² | Sprint 1 | ⬜ |
| 4 | Carrinho, formulário, `createOrder` + WhatsApp | DR-002, DR-003 | ⬜ |
| 5 | Responsivo, acessibilidade, README, publicação | Sprints 1-4 | ⬜ |

**Caminho crítico:** DR-001 → Sprint 1 → Sprint 2 → Sprint 3 → Sprint 4.
Sprint 3 pode correr em paralelo à 2 se as duas partirem da Sprint 1 pronta.

**Riscos abertos**

| Risco | Mitigação |
|---|---|
| Traduzir 713 linhas de design vira cópia literal de HTML | Tela a tela, primitivos primeiro |
| Calculadora de m² divergir do preço cobrado | Total real vem do trigger; calculadora é estimativa rotulada |
| Carrinho persistido guardar produto que saiu do ar | Sanear contra `fetchProducts()` ao carregar |

---

## 3. Changelog

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

**Ainda não existe**
- Nenhuma tela. `App.tsx` renderiza um `<h1>` com o nome da loja.

---

## 4. Como retomar

1. Ler este arquivo e `decisions/` — o que está `⛔` espera decisão, não trabalho.
2. Rodar o gate para confirmar que a base ainda está verde.
3. Pegar a próxima sprint em `03-tasks.md` e fazer **uma tela por turno**.
4. Ao terminar: atualizar o backlog e o changelog **aqui**, e só então considerar
   a sprint entregue.
