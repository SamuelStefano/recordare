# DR-003 — Número de WhatsApp de destino

**Status:** aberta — precisa de informação do Samuel
**Data:** 2026-08-14
**Bloqueia:** Sprint 4 (fechamento do pedido).

## Contexto

`whatsappMessage()` monta o texto do pedido, mas **ninguém sabe para qual número
enviar**. Não existe número em `.env.example`, no schema ou no design.

Sem isso, a última etapa do fluxo principal não fecha: o pedido entra na tabela
`orders` e o visitante fica sem para onde ir.

## O que preciso de você

O número de destino, em formato internacional (`5544...`).

## Onde ele vai

O número **não é segredo** — aparece no rodapé de qualquer loja e vai no link
`wa.me/<numero>` que o navegador abre. Então `VITE_WHATSAPP_PHONE` no `.env` é
adequado e não viola a regra de "nenhum segredo novo em `VITE_*`".

Alternativa: gravar na tabela `products`? Não — é configuração da loja, não do produto.

## Pendência menor

O texto atual de `whatsappMessage()` é fixo em português (`Olá`, `Pedido:`, `Total:`),
mesmo com a loja em inglês. Se o atendimento for bilíngue, vale passar `lang` para a
função. Se o atendimento é só em português, deixar como está — está correto assim.

## Decisão

_(aguardando)_
