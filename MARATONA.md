# Maratona Recordare — briefing do turno

Cole isto como prompt no Deck **com a lane de maratona ligada**. Um turno por tela:
o experimento mede escalada *por tipo de tarefa*, e um turno que faz as 4 telas
juntas colapsa as quatro medições numa só.

## Contexto

Loja de fotoporcelana para memoriais (medalhões, lápides, porcelanato, acessórios).
Design de origem: `~/recordare-design/Recordare.dc.html` (713 linhas, sintaxe Claude
Design: `<x-dc>`, `<sc-if>`, `<sc-for>`, `{{ }}`). Traduzir para React, não copiar HTML.

Stack já pronta em `~/recordare`: Vite + React 19 + TS + Tailwind v4 + Supabase.
Tokens de cor/fonte já estão em `src/index.css` como `@theme` — usar `text-brand`,
`bg-sand`, `font-serif` etc., nunca hex solto.

Dados: `src/lib/catalog.ts` (`fetchProducts`, `createOrder`). O schema `recordare`
no Supabase já tem os 10 produtos semeados. Bilíngue pt/en já vem nas colunas
`name_pt`/`name_en`/`desc_pt`/`desc_en`.

## Telas (uma por turno)

1. **Home** — hero, destaques, categorias, provas sociais, rodapé.
2. **Catálogo** — grade + filtros (categoria, cor, tamanho, acabamento) + ordenação.
3. **Produto** — galeria, seleção de tamanho/cor/acabamento, calculadora de m² para
   `unit = 'm2'`, adicionar ao carrinho.
4. **Carrinho → pedido** — revisão, dados do cliente, `createOrder()` e depois abre
   o WhatsApp com o resumo.

## Regras

- Componente por arquivo, PascalCase, arquivo de UI acima de ~150 linhas se quebra.
- Lógica em hook próprio; componente só renderiza JSX.
- Teste ao lado do arquivo (`x.tsx` + `x.test.tsx`).
- Comentário só para WHY não-óbvio. Zero comentário decorativo.
- **Nunca** mandar `total` no `createOrder`: um trigger recalcula do preço vigente.
- Nada de segredo novo em `VITE_*` além do que já está no `.env.example`.

## Gate — "entregue" é isto, não "achei que ficou bom"

```
npx tsc -b --noEmit && npx vitest run && npx vite build
```

Os três verdes, senão o turno não entregou.
