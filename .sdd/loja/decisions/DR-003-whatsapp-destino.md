# DR-003 — Número de WhatsApp de destino

**Status:** decidida — `VITE_WHATSAPP_PHONE`, opcional, com degradação
**Data:** 2026-08-14
**Bloqueia:** nada. Falta só você preencher o valor.

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

**`VITE_WHATSAPP_PHONE` no `.env`, e o pedido não depende dele para existir.**

O número continua sendo seu para preencher, mas eu me recusei a deixar isso bloquear
a loja. O desenho é:

1. `createOrder()` grava o pedido em `recordare.orders`. Esta é a etapa que não pode
   falhar — é o registro de venda, e o total sai do trigger.
2. Só **depois** do insert bem-sucedido a tela navega para `/pedido`, que mostra o
   número do pedido e o resumo.
3. Se `VITE_WHATSAPP_PHONE` estiver preenchido, `/pedido` abre o `wa.me` com o resumo
   e oferece o botão de reenviar. Se estiver vazio, a tela diz que o pedido foi
   recebido e que a loja entra em contato — **e o pedido está salvo do mesmo jeito**.

Isso inverte a dependência: sem o número a loja perde um atalho de atendimento, não a
venda. Um pedido perdido porque uma variável de ambiente estava vazia seria a pior
forma possível de falhar.

**Validação do valor.** O número é saneado antes de entrar na URL (`^\d{10,15}$` após
remover não-dígitos). Se vier lixo no `.env`, o link não é gerado — em vez de produzir
um `wa.me/<lixo>` que abre o WhatsApp num contato inexistente.

**Não é segredo.** `wa.me/<numero>` é público por construção; o número vai no rodapé.
`VITE_*` é o lugar certo e não viola a regra de segredos do `MARATONA.md`.

## Pendência menor — resolvida

`whatsappMessage()` agora recebe `lang`. A loja em inglês manda o pedido em inglês.
O custo foi um dicionário de seis linhas, e o inverso — cliente que navegou em inglês
recebendo `Olá / Pedido: / Total:` — é o tipo de detalhe que faz a loja parecer
amadora justamente no momento da compra.
