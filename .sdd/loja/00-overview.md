# Recordare — Loja

Loja de fotoporcelana para memoriais: medalhões, lápides, porcelanato e acessórios.
Vitrine pública, catálogo bilíngue pt/en, pedido fechado por WhatsApp.

## Você está aqui

```
[x] Fundação      scaffold, schema, RLS, camada de dados, testes
[ ] Sprint 1      layout base + Home
[ ] Sprint 2      Catálogo
[ ] Sprint 3      Produto
[ ] Sprint 4      Carrinho → pedido
[ ] Sprint 5      Acabamento e publicação
```

**Conclusão: ~15%** — a fundação está pronta e verde, nenhuma tela existe.

## Fluxo do usuário

```
Home ──▶ Catálogo ──▶ Produto ──┐
 │           │                  │
 └───────────┴──────────────────▼
                             Carrinho ──▶ createOrder() ──▶ WhatsApp
```

## Como navegar estes documentos

| Arquivo | O que responde |
|---|---|
| `01-requirements.md` | O QUE a loja precisa fazer, e o que está fora de escopo |
| `02-design.md` | COMO — rotas, i18n, estado, arquitetura de componentes |
| `03-tasks.md` | Tasks ordenadas por sprint, com critério de pronto |
| `04-status.md` | Backlog com status, roadmap e changelog — **atualizar ao fim de cada sprint** |
| `decisions/` | Decisões que precisam de OK do Samuel antes de virar código |

## Gate de entrega

Nenhuma sprint está entregue sem os três verdes:

```bash
npx tsc -b --noEmit && npx vitest run && npx vite build
```

## Referências

- Design de origem: `~/recordare-design/Recordare.dc.html` (713 linhas, sintaxe Claude Design).
  **Traduzir para React, não copiar HTML.**
- Briefing original do turno: `MARATONA.md` na raiz do repo.
- Tokens de cor e fonte: `src/index.css` (`@theme`). Usar `text-brand`, `bg-sand`,
  `font-serif` — nunca hex solto.
